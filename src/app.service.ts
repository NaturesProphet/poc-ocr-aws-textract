import { Injectable } from '@nestjs/common';
import { TextractClient, AnalyzeDocumentCommand, AnalyzeDocumentCommandInput, Block } from "@aws-sdk/client-textract";
import * as fs from 'fs';



@Injectable()
export class AppService {
  private client: TextractClient;
  constructor() {
    this.client = new TextractClient( {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_KEY,
        secretAccessKey: process.env.AWS_SECRET
      }
    } );
  }

  /**
   * Utiliza o amazon Textract para fazer uma análise de OCR de um arquivo e obter informações 
   * sobre o conteúdo desse arquivo em um formato <chave: valor>
   * @returns retorna um dicionario de chave e valores encontrados no arquivo
   * @author Mateus Garcia
   * Documentação de referência utilizada para orientar o desenvolvimento dessa poc:
   * https://docs.aws.amazon.com/textract/latest/dg/examples-extract-kvp.html
  */
  async poc () {
    const blocks = await this.getBlocks();
    const { key_map, value_map, block_map } = this.get_kv_map( blocks );

    const kvs = this.getKVRelationship( key_map, value_map, block_map );
    this.printKVs( kvs );
    return kvs;
  }




  private async getBlocks () {
    const testFile = '/home/mgarcia/teste.pdf'; //to-do receber via requisição
    const params: AnalyzeDocumentCommandInput = {
      Document: {
        Bytes: fs.readFileSync( testFile )
      },
      FeatureTypes: [ "FORMS" ]
    };

    const command = new AnalyzeDocumentCommand( params );

    try {
      const data = await this.client.send( command );
      return data.Blocks;
    } catch ( error ) {
      console.log( error );
      throw error;
    }
  }

  private get_kv_map ( blocks: Block[] ) {
    const key_map = {}
    const value_map = {}
    const block_map = {}

    blocks.forEach( block => {
      {
        delete block[ 'Geometry' ]
        delete block[ 'Polygon' ]
        const block_id = block[ 'Id' ];
        block_map[ block_id ] = block;
        if ( block[ 'BlockType' ] == "KEY_VALUE_SET" ) {
          if ( block[ 'EntityTypes' ].includes( 'KEY' ) ) {
            key_map[ block_id ] = block;
          } else {
            value_map[ block_id ] = block;
          }
        }
      }
    } );

    return { key_map, value_map, block_map }
  }

  private getKVRelationship ( keyMap, valueMap, blockMap ) {
    const kvs = {};

    for ( const [ blockId, keyBlock ] of Object.entries( keyMap ) ) {
      const valueBlock = this.findValueBlock( keyBlock, valueMap );
      const key = this.getText( keyBlock, blockMap );
      const val = this.getText( valueBlock, blockMap );
      if ( kvs[ key ] === undefined ) {
        kvs[ key ] = [];
      }
      kvs[ key ].push( val );
    }

    return kvs;
  }

  private findValueBlock ( keyBlock, valueMap ) {
    for ( const relationship of keyBlock.Relationships ) {
      if ( relationship.Type === 'VALUE' ) {
        for ( const valueId of relationship.Ids ) {
          return valueMap[ valueId ];
        }
      }
    }
  }

  private getText ( result, blocksMap ) {
    let text = '';
    if ( result.Relationships ) {
      for ( const relationship of result.Relationships ) {
        if ( relationship.Type === 'CHILD' ) {
          for ( const childId of relationship.Ids ) {
            const word = blocksMap[ childId ];
            if ( word.BlockType === 'WORD' ) {
              text += word.Text + ' ';
            }
            if ( word.BlockType === 'SELECTION_ELEMENT' ) {
              if ( word.SelectionStatus === 'SELECTED' ) {
                text += 'X ';
              }
            }
          }
        }
      }
    }

    return text;
  }

  private printKVs ( kvs ) {
    for ( const [ key, value ] of Object.entries( kvs ) ) {
      console.log( key + ':', value );
    }
  }

  private searchValue ( kvs, searchKey ) {
    for ( const [ key, value ] of Object.entries( kvs ) ) {
      const regex = new RegExp( searchKey, 'i' );
      if ( regex.test( key ) ) {
        return value;
      }
    }
  }
}


