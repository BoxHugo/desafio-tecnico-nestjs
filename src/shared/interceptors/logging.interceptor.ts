import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DateUtils } from '@shared/utils/utilsDate';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    const start = DateUtils.getCurrentDate();

    const tempBody = { ...body };
    if (tempBody.password) {
      delete tempBody.password;
    }

    this.logger.log(
      `→ send request: (${start}) [${method}] ${url} — payload: ${JSON.stringify(tempBody)}`,
    );

    return next.handle().pipe(
      tap(() => {
        const end = DateUtils.getCurrentDate();
        const res = context.switchToHttp().getResponse();
        this.logger.log(
          `response: (${end}) [${method}] ${url} — status ${res.statusCode} (${Date.now() - now}ms)`,
        );
      }),
      catchError((err) => {
        const errorResp =
          err?.response ?? err.message ?? 'Something went wrong';
        this.logger.error(
          `response error: (${DateUtils.getCurrentDate()}) [${method}] ${url} — ${JSON.stringify(errorResp)} (${Date.now() - now}ms)`,
        );

        if (err instanceof BadRequestException) {
          return throwError(() => new BadRequestException());
        } else if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}
