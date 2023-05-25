import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags( 'Textract OCR' )
@Controller()
export class AppController {
  constructor( private readonly appService: AppService ) { }


  @ApiOperation( {
    summary: 'Envia o documento para a AWS e retorna a análise dos campos detectados no ocr.'
  } )
  @Get( 'poc' )
  poc () {
    return this.appService.poc();
  }
}
