import { ConfigFileAuthenticationDetailsProvider } from 'oci-common';
import {
  NetworkLoadBalancerClient,
  NetworkLoadBalancerWaiter,
} from 'oci-networkloadbalancer';
import { BackendCollection } from 'oci-networkloadbalancer/lib/model';

const getProvider = (profile: string) => {
  const configurationFilePath = process.env.OCI_CONFIG_FILE;
  const configProfile = profile;
  return new ConfigFileAuthenticationDetailsProvider(
    configurationFilePath,
    configProfile,
  );
};

const listBackends = async (
  ociProfile: string,
  networkLoadBalancerId: string,
  backendSetName: string,
): Promise<BackendCollection> => {
  const provider = getProvider(ociProfile);

  const client = new NetworkLoadBalancerClient({
    authenticationDetailsProvider: provider,
  });

  const res = await client.listBackends({
    backendSetName: backendSetName,
    networkLoadBalancerId: networkLoadBalancerId,
  });
  return res.backendCollection;
};

const removeBackend = async (
  ociProfile: string,
  networkLoadBalancerId: string,
  backendSetName: string,
  ip: string,
  port: number,
) => {
  const provider = getProvider(ociProfile);
  const client = new NetworkLoadBalancerClient({
    authenticationDetailsProvider: provider,
  });

  // list network load balancers backends
  const backends = await listBackends(
    ociProfile,
    networkLoadBalancerId,
    backendSetName,
  );

  // find the backend to remove
  const backend = backends.items.find(
    (backend) => backend.name === `${ip}:${port}`,
  );

  if (backend) {
    console.info(`Removing backend ${ip}:${port} from ${backendSetName}`);
    const res = await client.deleteBackend({
      backendSetName: backendSetName,
      networkLoadBalancerId: networkLoadBalancerId,
      backendName: `${ip}:${port}`,
    });
    // await for work request to complete
    await waitForSuccess(client, res.opcWorkRequestId);
  }
};

const addBackend = async (
  ociProfile: string,
  networkLoadBalancerId: string,
  backendSetName: string,
  ip: string,
  port: number,
) => {
  const provider = getProvider(ociProfile);
  const client = new NetworkLoadBalancerClient({
    authenticationDetailsProvider: provider,
  });

  // list network load balancers backends
  const backends = await listBackends(
    ociProfile,
    networkLoadBalancerId,
    backendSetName,
  );

  // make sure the backend is not already there
  const backend = backends.items.find(
    (backend) => backend.name === `${ip}:${port}`,
  );

  if (!backend) {
    console.info(`Adding backend ${ip}:${port} to ${backendSetName}`);
    const res = await client.createBackend({
      backendSetName: backendSetName,
      networkLoadBalancerId: networkLoadBalancerId,
      createBackendDetails: {
        ipAddress: ip,
        port: port,
        name: `${ip}:${port}`,
      },
    });
    // await for work request to complete
    await waitForSuccess(client, res.opcWorkRequestId);
  }
};

const waitForSuccess = async (
  client: NetworkLoadBalancerClient,
  workRequestId: string,
) => {
  let status: string;
  new NetworkLoadBalancerWaiter(client);
  do {
    try {
      const response = await client.getWorkRequest({ workRequestId });
      status = response.workRequest.status;
      console.info('Current status:', status);

      if (status === 'SUCCEEDED') {
        console.info('Work request succeeded:', response);
        return;
      } else if (status === 'FAILED') {
        console.error('Work request failed:', response);
        return;
      }

      // Wait for a short period before checking the status again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error while checking work request status:', error);
      return;
    }
  } while (status !== 'SUCCEEDED');
};

export { listBackends, addBackend, removeBackend };
