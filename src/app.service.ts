import { Injectable } from '@nestjs/common';
import { AdmissionRequest, AdmissionReview } from './k8s.types';
import { addBackend, removeBackend } from './oci';
import { extractLableValue, getIPv4InternalIP } from './utils';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async oracle(admissionReview: AdmissionReview) {
    const request: AdmissionRequest = admissionReview.request;

    // get the node name
    const nodeName = request.object.metadata.name;

    // get the node InternalIP v4 address
    const ipV4 = getIPv4InternalIP(request.object.status.addresses);

    // check if the node is control plane
    const controlPlane =
      typeof request.object.metadata.labels[
        'node-role.kubernetes.io/control-plane'
      ] !== 'undefined';

    // check the current and olf `kured.io/reboot` label value
    const reboot = extractLableValue(
      'kured.io/reboot',
      request.object.metadata.labels,
    );
    const oldReboot = extractLableValue(
      'kured.io/reboot',
      request.oldObject.metadata.labels,
    );

    // process
    if (oldReboot !== reboot && reboot === 'true') {
      if (controlPlane) {
        console.info(
          `Control Plane Node ${nodeName} is rebooting, removing from API load balancer`,
        );
        await removeBackend(
          process.env.OCI_API_CONFIG_PROFILE,
          process.env.OCI_API_NETWORK_LOAD_BALANCER_ID,
          'control-plane',
          ipV4,
          6443,
        );
      } else {
        console.info(
          `Worker Node ${nodeName} is rebooting, removing from Ingress load balancer`,
        );
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
        console.info(
          `Control Plane Node ${nodeName} is back online, adding to API load balancer`,
        );
        await addBackend(
          process.env.OCI_API_CONFIG_PROFILE,
          process.env.OCI_API_NETWORK_LOAD_BALANCER_ID,
          'control-plane',
          ipV4,
          6443,
        );
      } else {
        console.info(
          `Worker Node ${nodeName} is back online, adding to Ingress load balancer`,
        );
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
