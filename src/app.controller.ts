import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AdmissionReview } from './k8s.types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/oracle')
  @HttpCode(HttpStatus.OK)
  async oracle(
    @Body() admissionReview: AdmissionReview,
  ): Promise<AdmissionReview> {
    // debug
    console.log('START: Incoming request');
    console.log('object', admissionReview.request.object.metadata);
    console.log('oldObject', admissionReview.request.oldObject);
    console.log('END: Incoming request');
    // always allow the request
    const response = {
      ...admissionReview,
      response: {
        uid: admissionReview.request.uid,
        allowed: true,
      },
    };
    this.appService.oracle(admissionReview);
    return response;
  }
}
