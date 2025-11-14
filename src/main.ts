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

  // ✅ 로컬 개발: swagger-themes 사용
  // ✅ Vercel: CDN에서 CSS 로드
  const isProduction = process.env.NODE_ENV === 'production';

  let options;
  if (isProduction) {
    // Vercel용: CDN에서 다크 테마 CSS 로드
    options = {
      explorer: false,
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      ],
      customCss: `
        .swagger-ui { background-color: #1e1e1e; color: #d4d4d4; }
        .swagger-ui .info .title { color: #d4d4d4; }
        .swagger-ui .scheme-container { background: #2d2d2d; }
        .swagger-ui .topbar { display: none; }
      `,  // 간단한 다크 테마
    };
  } else {
    // 로컬 개발용: swagger-themes 사용
    const theme = new SwaggerTheme();
    options = {
      explorer: false,
      customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
    };
  }

  SwaggerModule.setup(`api`, app, document, options);

  // ✅ Vercel Serverless 설정
  if (!isProduction) {
    await app.listen(12345);
    console.log(`Application is running on: http://localhost:12345/api`);
  } else {
    // Vercel: init만 호출
    await app.init();
  }

  // ✅ Express 인스턴스 반환 (Vercel이 사용)
  return app.getHttpAdapter().getInstance();
}

// ✅ Vercel Serverless용 export
export default bootstrap();

// 로컬 개발 시에만 bootstrap 실행
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
