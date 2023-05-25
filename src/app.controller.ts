import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';

const multerOptions: MulterOptions = {
  limits: {
    files: 1,
    fileSize: 10000000
  },
  storage: diskStorage( {
    destination: `${__dirname}/../../../tmp`,
    filename: ( req, file, cb ) => {
      cb( null, file.originalname );
    },
  } )
}

@ApiTags( 'Textract OCR' )
@Controller()
export class AppController {
  constructor( private readonly appService: AppService ) { }


  @ApiOperation( {
    summary: 'Envia o documento para a AWS e retorna a análise dos campos detectados no ocr.'
  } )
  @Post( 'poc' )
  @ApiConsumes( 'multipart/form-data' )
  @ApiBody( {
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  } )
  @UseInterceptors( FileInterceptor( 'file', multerOptions ) )
  poc ( @UploadedFile() file ) {
    return this.appService.poc( file );
  }
}
