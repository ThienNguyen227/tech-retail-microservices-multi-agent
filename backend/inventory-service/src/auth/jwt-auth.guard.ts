import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { verify } from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: JwtPayload;
    }>();

    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Thiếu access token");
    }

    const accessToken = authorization.slice(7);
    const accessSecret = process.env.JWT_ACCESS_SECRET;

    if (!accessSecret) {
      throw new InternalServerErrorException(
        "JWT access secret chưa được cấu hình",
      );
    }

    try {
      const payload = verify(accessToken, accessSecret);

      if (
        typeof payload === "string" ||
        payload.type !== "access" ||
        typeof payload.sub !== "string"
      ) {
        throw new UnauthorizedException("Access token không hợp lệ");
      }

      request.user = payload;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Access token không hợp lệ hoặc đã hết hạn");
    }
  }
}