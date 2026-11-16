import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as amqp from 'amqplib';

import { CreateCustomerService } from '../customer-session/create_customer/create_customer.service';

@Injectable()
export class RabbitMQService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly createCustomerService: CreateCustomerService,
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

  private readonly rabbitmqUrl =
    process.env.RABBITMQ_URL ||
    'amqp://admin:password@localhost:5672';

  // User-Service -> Customer-Service
  private readonly exchangeName = 'user.events';

  private readonly queueName = 'customer.user.queue';

  private readonly routingKey = 'user.created';

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

    let connection: amqp.ChannelModel | undefined;
    let channel: amqp.Channel | undefined;

    try {
      console.log('Connecting RabbitMQ...');

      // ======================================================
      // CONNECTION
      // ======================================================

      connection = await amqp.connect(
        this.rabbitmqUrl,
      );

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
        console.error('RabbitMQ connection closed');

        if (this.connection === connection) {
          this.connection = undefined;
          this.channel = undefined;
        }

        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      });

      // ======================================================
      // CHANNEL
      // ======================================================

      channel = await connection.createChannel();

      this.channel = channel;

      console.log('RabbitMQ channel created');

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

      console.log(
        `Exchange "${this.exchangeName}" ready`,
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

      console.log(
        `Queue "${this.queueName}" ready`,
      );

      // ======================================================
      // BINDING
      // ======================================================

      await channel.bindQueue(
        this.queueName,
        this.exchangeName,
        this.routingKey,
      );

      console.log(
        `Binding "${this.routingKey}" ready`,
      );

      // ======================================================
      // CONSUMER
      // ======================================================

      await this.consume(channel);

      console.log('Consumer ready');

      // ======================================================
      // CONNECT SUCCESS
      // ======================================================

      this.reconnecting = false;

      console.log(
        'RabbitMQ setup completed',
      );

    } catch (error) {
      console.error(
        'RabbitMQ connection failed:',
        error instanceof Error
          ? error.message
          : error,
      );

      if (this.channel === channel) {
        this.channel = undefined;
      }

      if (this.connection === connection) {
        this.connection = undefined;
      }

      this.reconnecting = false;

      // Dọn channel và connection nếu setup thất bại
      try {
        await channel?.close();
      } catch {
        // Bỏ qua lỗi khi channel đã đóng
      }

      try {
        await connection?.close();
      } catch {
        // Bỏ qua lỗi khi connection đã đóng
      }

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

  private async consume(
    channel: amqp.Channel,
  ): Promise<void> {

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

          const routingKey =
            message.fields.routingKey;

          const payload = JSON.parse(
            message.content.toString(),
          );

          console.log(
            'Received event:',
            {
              routingKey,
              payload,
            },
          );

          // ======================================================
          // USER CREATED
          // ======================================================

          if (
            routingKey ===
            'user.created'
          ) {
            await this.createCustomerService.createCustomer(
              payload.eventId,
              payload.eventType,
              payload.data,
            );

            console.log(
              `Customer được tạo thành công cho User ID: ${payload.data.user_id}`,
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