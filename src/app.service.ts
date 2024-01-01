import { Injectable } from '@nestjs/common';
import { AdmissionRequest, AdmissionReview } from './k8s.types';
import { addBackend, getIPv4InternalIP, removeBackend } from './oci';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async oracle(admissionReview: AdmissionReview) {
    const request: AdmissionRequest = admissionReview.request;

    // get the node InternalIP v4 address
    const ipV4 = getIPv4InternalIP(request.object.status.addresses);

    // check if the node is control plane
    const controlPlane =
      typeof request.object.metadata.labels[
        'node-role.kubernetes.io/control-plane'
      ] !== 'undefined';

    // check the current and olf `kured.io/reboot` label value
    const reboot = request.object.metadata.labels['kured.io/reboot'] ?? null;
    const oldReboot =
      request.oldObject.metadata.labels['kured.io/reboot'] ?? null;

    // process
    if (oldReboot !== reboot && reboot === 'true') {
      if (controlPlane) {
        console.log('Remove the controlPlane node from api load balancer');
        await removeBackend(
          process.env.OCI_API_CONFIG_PROFILE,
          process.env.OCI_API_NETWORK_LOAD_BALANCER_ID,
          'control-plane',
          ipV4,
          6443,
        );
      } else {
        console.log('Remove the worker node from ingress load balancer');
        await removeBackend(
          process.env.OCI_INGRESS_CONFIG_PROFILE,
          process.env.OCI_INGRESS_NETWORK_LOAD_BALANCER_ID,
          'http',
          ipV4,
          80,
        );

        await removeBackend(
          process.env.OCI_INGRESS_CONFIG_PROFILE,
          process.env.OCI_INGRESS_NETWORK_LOAD_BALANCER_ID,
          'https',
          ipV4,
          443,
        );
      }
    } else if (oldReboot !== reboot && reboot === 'false') {
      if (controlPlane) {
        console.log('add the controlPlane node to api load balancer');
        await addBackend(
          process.env.OCI_API_CONFIG_PROFILE,
          process.env.OCI_API_NETWORK_LOAD_BALANCER_ID,
          'control-plane',
          ipV4,
          6443,
        );
      } else {
        console.log('add the worker node to ingress load balancer');
        await addBackend(
          process.env.OCI_INGRESS_CONFIG_PROFILE,
          process.env.OCI_INGRESS_NETWORK_LOAD_BALANCER_ID,
          'http',
          ipV4,
          80,
        );
        await addBackend(
          process.env.OCI_INGRESS_CONFIG_PROFILE,
          process.env.OCI_INGRESS_NETWORK_LOAD_BALANCER_ID,
          'https',
          ipV4,
          443,
        );
      }
    }
  }
}
