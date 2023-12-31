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

  @Post()
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() admissionReview: AdmissionReview): AdmissionReview {
    return this.appService.validate(admissionReview);
  }
}
