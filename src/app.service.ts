import { Injectable } from '@nestjs/common';
import { AdmissionRequest, AdmissionReview } from './k8s.types';
import { addBackend, removeBackend } from './oci';
import { extractLabelValue, getIPv4InternalIP } from './utils';

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
      extractLabelValue(
        'node-role.kubernetes.io/control-plane',
        request.object,
      ) === '';

    // check the current and olf `kured.io/reboot` label value
    const reboot = extractLabelValue('kured.io/reboot', request.object);
    const oldReboot = extractLabelValue('kured.io/reboot', request.oldObject);

    // process
    if (oldReboot !== reboot && reboot === 'true') {
      if (controlPlane) {
        console.info(
          `Control Plane Node ${nodeName} is rebooting, removing from API load balancer`,
        );
        try {
          await removeBackend(
            process.env.OCI_API_CONFIG_PROFILE,
            process.env.OCI_API_NETWORK_LOAD_BALANCER_ID,
            'control-plane',
            ipV4,
            6443,
          );
        } catch (error) {
          console.error(error);
        }
      } else {
        console.info(
          `Worker Node ${nodeName} is rebooting, removing from Ingress load balancer`,
        );
        try {
          await removeBackend(
            process.env.OCI_INGRESS_CONFIG_PROFILE,
            process.env.OCI_INGRESS_NETWORK_LOAD_BALANCER_ID,
            'http',
            ipV4,
            80,
          );
        } catch (error) {
          console.error(error);
        }

        try {
          await removeBackend(
            process.env.OCI_INGRESS_CONFIG_PROFILE,
            process.env.OCI_INGRESS_NETWORK_LOAD_BALANCER_ID,
            'https',
            ipV4,
            443,
          );
        } catch (error) {}
      }
    } else if (oldReboot !== reboot && reboot === 'false') {
      if (controlPlane) {
        console.info(
          `Control Plane Node ${nodeName} is back online, adding to API load balancer`,
        );
        try {
          await addBackend(
            process.env.OCI_API_CONFIG_PROFILE,
            process.env.OCI_API_NETWORK_LOAD_BALANCER_ID,
            'control-plane',
            ipV4,
            6443,
          );
        } catch (error) {
          console.error(error);
        }
      } else {
        console.info(
          `Worker Node ${nodeName} is back online, adding to Ingress load balancer`,
        );
        try {
          await addBackend(
            process.env.OCI_INGRESS_CONFIG_PROFILE,
            process.env.OCI_INGRESS_NETWORK_LOAD_BALANCER_ID,
            'http',
            ipV4,
            80,
          );
        } catch (error) {
          console.error(error);
        }

        try {
          await addBackend(
            process.env.OCI_INGRESS_CONFIG_PROFILE,
            process.env.OCI_INGRESS_NETWORK_LOAD_BALANCER_ID,
            'https',
            ipV4,
            443,
          );
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
}
