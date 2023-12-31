import { Injectable } from '@nestjs/common';
import { AdmissionRequest, AdmissionReview } from './k8s.types';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  validate(admissionReview: AdmissionReview): AdmissionReview {
    const request: AdmissionRequest = admissionReview.request;
    const response = {
      ...admissionReview,
      response: {
        uid: request.uid,
        allowed: true,
      },
    };

    // Implement your validation logic here
    // If validation fails, set `response.response.allowed` to false and provide a status message

    return response;
  }
}
