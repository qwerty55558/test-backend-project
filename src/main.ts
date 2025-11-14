import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { AppModule } from './app.module';

import { ClassValidatorException } from './util/class-validator-exeption';
import { PrismaClientExceptionFilter } from './util/prisma-client-exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use((req, res, next) => {
    req.headers['content-type'] = 'application/json';
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => new ClassValidatorException(errors),
    }),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle('ONEBITE BOOKS API')
    .setDescription(`한입 도서몰 API 서버 문서입니다.`)
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const theme = new SwaggerTheme();
  const options = {
    explorer: false,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
  };
  SwaggerModule.setup(`api`, app, document, options);

  // ✅ 로컬 개발용 (Vercel에서는 실행 안 됨)
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(12345);
    console.log(`Application is running on: http://localhost:12345`);
  } else {
    // ✅ Vercel Serverless용
    await app.init();
  }

  // ✅ Vercel이 사용할 Express 인스턴스 반환
  return app.getHttpAdapter().getInstance();
}

// ✅ Vercel Serverless로 export
export default bootstrap();

// 로컬 개발 시에도 bootstrap 실행
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
