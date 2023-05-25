import { config } from 'dotenv'; config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap () {
  const app = await NestFactory.create( AppModule );
  const options = new DocumentBuilder();
  options.setTitle( 'PoC OCR chave-valor com AWS Textract' )
  options.setDescription( 'extraindo chave/valor de documentos através do OCR do AWS Textract' )
  const document = SwaggerModule.createDocument( app, options.build() );
  SwaggerModule.setup( '', app, document );
  await app.listen( 3000 );
}
bootstrap();
