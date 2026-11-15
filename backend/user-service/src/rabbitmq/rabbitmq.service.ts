import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  // ======================================================
  // RABBITMQ CONNECTION
  // ======================================================

  private connection?: amqp.ChannelModel;
  private channel?: amqp.ConfirmChannel;

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
    process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672';

  // User-Service (Producer) -> Customer-Service (Consumer)
  private readonly userExchange = 'user.events';

  private readonly reconnectDelay = 5000;

  // ======================================================
  // MODULE INIT
  // ======================================================

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  // ======================================================
  // CONNECT
  // ======================================================

  private async connect(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    // Đã kết nối và có channel
    if (this.connection && this.channel) {
      return;
    }

    // Tránh nhiều lần connect đồng thời
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;

    let connection: amqp.ChannelModel | undefined;
    let channel: amqp.ConfirmChannel | undefined;

    try {
      console.log('Connecting RabbitMQ...');

      // ======================================================
      // CONNECT
      // ======================================================

      connection = await amqp.connect(this.rabbitmqUrl);
      this.connection = connection;

      console.log('RabbitMQ connected');

      // ======================================================
      // CONNECTION ERROR
      // ======================================================

      connection.on('error', (error) => {
        console.error(
          'RabbitMQ connection error:',
          error instanceof Error ? error.message : error,
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
      // CREATE CONFIRM CHANNEL
      //
      // ConfirmChannel cho phép Producer nhận xác nhận ACK/NACK
      // từ RabbitMQ cho từng message publish.
      // ======================================================

      channel = await connection.createConfirmChannel();
      this.channel = channel;

      console.log('RabbitMQ confirm channel created');

      channel.on('error', (error) => {
        console.error(
          'RabbitMQ channel error:',
          error instanceof Error ? error.message : error,
        );
      });

      channel.on('close', () => {
        console.error('RabbitMQ channel closed');

        if (this.channel === channel) {
          this.channel = undefined;
        }

        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      });

      // ======================================================
      // USER EXCHANGE
      // ======================================================

      await channel.assertExchange(this.userExchange, 'direct', {
        durable: true,
      });

      console.log(`Exchange "${this.userExchange}" ready`);

      // ======================================================
      // CONNECT SUCCESS
      // ======================================================

      this.reconnecting = false;

      console.log('RabbitMQ Producer setup completed');
    } catch (error) {
      console.error(
        'RabbitMQ connection failed:',
        error instanceof Error ? error.message : error,
      );

      if (this.channel === channel) {
        this.channel = undefined;
      }

      if (this.connection === connection) {
        this.connection = undefined;
      }

      this.reconnecting = false;

      // Dọn kết nối/channel nếu quá trình setup bị lỗi
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
    if (this.isDestroyed || this.reconnectTimer) {
      return;
    }

    console.log(
      `RabbitMQ will reconnect in ${this.reconnectDelay / 1000} seconds...`,
    );

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      await this.connect();
    }, this.reconnectDelay);
  }

  // ======================================================
  // PUBLISH
  // ======================================================

  /**
   * Publish một event lên user.events.
   *
   * Hàm chỉ resolve khi RabbitMQ xác nhận publish thành công.
   * Outbox Worker chỉ nên cập nhật OutboxEvent sang PUBLISHED
   * sau khi hàm này resolve thành công.
   *
   * Ví dụ routingKey:
   * - user.created
   * - user.updated
   * - user.deleted
   */
  async publish(routingKey: string, message: unknown): Promise<void> {
    const channel = this.channel;

    if (!channel) {
      throw new Error('RabbitMQ confirm channel is not available');
    }

    if (!routingKey?.trim()) {
      throw new Error('RabbitMQ routingKey is required');
    }

    let content: Buffer;

    try {
      const serializedMessage = JSON.stringify(message);

      if (serializedMessage === undefined) {
        throw new Error('Message cannot be serialized to JSON');
      }

      content = Buffer.from(serializedMessage);
    } catch (error) {
      throw new Error(
        `Cannot serialize RabbitMQ message: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // Publisher Confirm: chờ RabbitMQ ACK/NACK message này
    await new Promise<void>((resolve, reject) => {
      try {
        channel.publish(
          this.userExchange,
          routingKey,
          content,
          {
            persistent: true,
            contentType: 'application/json',
          },
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          },
        );
      } catch (error) {
        reject(error);
      }
    });

    console.log('Published RabbitMQ event:', {
      exchange: this.userExchange,
      routingKey,
    });
  }

  // ======================================================
  // MODULE DESTROY
  // ======================================================

  async onModuleDestroy(): Promise<void> {
    this.isDestroyed = true;

    // Không reconnect nữa
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    // Lưu reference rồi xóa state trước khi close
    const channel = this.channel;
    const connection = this.connection;

    this.channel = undefined;
    this.connection = undefined;

    // Close channel
    try {
      await channel?.close();
    } catch (error) {
      console.error(
        'Error closing RabbitMQ channel:',
        error instanceof Error ? error.message : error,
      );
    }

    // Close connection
    try {
      await connection?.close();
    } catch (error) {
      console.error(
        'Error closing RabbitMQ connection:',
        error instanceof Error ? error.message : error,
      );
    }
  }
}
