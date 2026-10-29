import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as amqp from 'amqplib';

import { CreateWarrantyService } from '../customer_session/create_warranty/create_warranty.service';

@Injectable()
export class RabbitMQService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly createWarrantyService: CreateWarrantyService,
  ) {}

  // ======================================================
  // RABBITMQ
  // ======================================================

  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  // ======================================================
  // RECONNECT STATE
  // ======================================================

  private reconnecting = false;
  private reconnectTimer?: NodeJS.Timeout;
  private isDestroyed = false;

  // ======================================================
  // CONFIG
  // ======================================================

  private readonly rabbitmqUrl = 'amqp://admin:password@localhost:5672';

  private readonly exchangeName = 'order.events';

  private readonly queueName = 'order.warranty.queue';

  private readonly routingKey = 'order.warranty.eligible';

  private readonly reconnectDelay = 5000;

  // ======================================================
  // MODULE INIT
  // ======================================================

  async onModuleInit() {
    await this.connect();
  }

  // ======================================================
  // CONNECT
  // ======================================================

  private async connect(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    // Đã connected
    if (this.connection && this.channel) {
      return;
    }

    // Đang reconnect
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;

    try {
      console.log('Connecting RabbitMQ...');

      // ======================================================
      // CONNECTION
      // ======================================================

      const connection = await amqp.connect(this.rabbitmqUrl);

      this.connection = connection;

      console.log('RabbitMQ connected');

      // ======================================================
      // CONNECTION ERROR
      // ======================================================

      connection.on('error', (error) => {
        console.error(
          'RabbitMQ connection error:',
          error instanceof Error
            ? error.message
            : error,
        );
      });

      // ======================================================
      // CONNECTION CLOSED
      // ======================================================

      connection.on('close', () => {
        console.error(
          'RabbitMQ connection closed',
        );

        this.connection = undefined;
        this.channel = undefined;

        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      });

      // ======================================================
      // CHANNEL
      // ======================================================

      const channel = await connection.createChannel();

      this.channel = channel;

      // ======================================================
      // EXCHANGE
      // ======================================================

      await channel.assertExchange(
        this.exchangeName,
        'direct',
        {
          durable: true,
        },
      );

      // ======================================================
      // QUEUE
      // ======================================================

      await channel.assertQueue(
        this.queueName,
        {
          durable: true,
        },
      );

      // ======================================================
      // BINDING
      // ======================================================

      await channel.bindQueue(
        this.queueName,
        this.exchangeName,
        this.routingKey,
      );

      // ======================================================
      // CONSUMER
      // ======================================================

      await this.consume(channel);

      // ======================================================
      // CONNECT SUCCESS
      // ======================================================

      this.reconnecting = false;

      console.log(
        `Warranty consumer ready: ${this.queueName} -> ${this.routingKey}`,
      );
    } catch (error) {
      console.error(
        'RabbitMQ connection failed:',
        error instanceof Error
          ? error.message
          : error,
      );

      this.connection = undefined;
      this.channel = undefined;

      this.reconnecting = false;

      if (!this.isDestroyed) {
        this.scheduleReconnect();
      }
    }
  }

  // ======================================================
  // RECONNECT
  // ======================================================

  private scheduleReconnect(): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    console.log(
      `RabbitMQ will reconnect in ${
        this.reconnectDelay / 1000
      } seconds...`,
    );

    this.reconnectTimer = setTimeout(
      async () => {
        this.reconnectTimer = undefined;

        await this.connect();
      },
      this.reconnectDelay,
    );
  }

  // ======================================================
  // CONSUMER
  // ======================================================

  private async consume(channel: amqp.Channel): Promise<void> {
    await channel.consume(
      this.queueName,
      async (message) => {
        if (!message) {
          return;
        }

        try {
          // ======================================================
          // PARSE MESSAGE
          // ======================================================

          const routingKey = message.fields.routingKey;

          const payload = JSON.parse(
            message.content.toString(),
          );

          console.log('Warranty received event:', {
            routingKey,
            payload,
          });

          // ======================================================
          // ORDER WARRANTY ELIGIBLE
          // ======================================================

          if (routingKey === 'order.warranty.eligible') {
            if (
              !payload.eventId ||
              !payload.eventType ||
              !payload.data
            ) {
              throw new Error(
                'Invalid order.warranty.eligible payload',
              );
            }

            await this.createWarrantyService.handleOrderWarrantyEligible(
              payload.eventId,
              payload.eventType,
              payload.data,
            );

            console.log(
              `Warranty created successfully for event ${payload.eventId}`,
            );
          } else {
            // Queue này chỉ dành cho warranty event.
            // Không ACK nhầm event chưa được xử lý.
            throw new Error(
              `Unsupported routing key: ${routingKey}`,
            );
          }

          // ======================================================
          // ACK
          // ======================================================

          channel.ack(message);
        } catch (error) {
          console.error(
            'Error processing RabbitMQ message:',
            error instanceof Error
              ? error.message
              : error,
          );

          // ======================================================
          // NACK + REQUEUE
          // ======================================================

          try {
            channel.nack(
              message,
              false,
              true,
            );
          } catch (ackError) {
            console.error(
              'Failed to nack RabbitMQ message:',
              ackError instanceof Error
                ? ackError.message
                : ackError,
            );
          }
        }
      },
    );

    console.log(
      'Consumer is listening...',
    );
  }

  // ======================================================
  // MODULE DESTROY
  // ======================================================

  async onModuleDestroy() {
    this.isDestroyed = true;

    // Không reconnect nữa
    if (this.reconnectTimer) {
      clearTimeout(
        this.reconnectTimer,
      );

      this.reconnectTimer = undefined;
    }

    // ======================================================
    // CLOSE CHANNEL
    // ======================================================

    try {
      await this.channel?.close();
    } catch (error) {
      console.error(
        'Error closing RabbitMQ channel:',
        error instanceof Error
          ? error.message
          : error,
      );
    }

    // ======================================================
    // CLOSE CONNECTION
    // ======================================================

    try {
      await this.connection?.close();
    } catch (error) {
      console.error(
        'Error closing RabbitMQ connection:',
        error instanceof Error
          ? error.message
          : error,
      );
    }

    this.channel = undefined;
    this.connection = undefined;
  }
}