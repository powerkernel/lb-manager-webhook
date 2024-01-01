const extractLabelValue = (
  labelKey: string,
  object: { metadata: { labels: { [x: string]: any } } },
) => {
  if (object && object.metadata && object.metadata.labels) {
    return object.metadata.labels[labelKey];
  }
  return null;
};

const getIPv4InternalIP = (addresses: [{ type: string; address: string }]) => {
  for (const address of addresses) {
    if (address.type === 'InternalIP' && isIPv4(address.address)) {
      return address.address;
    }
  }
  return null;
};

const isIPv4 = (addr: string) => {
  // Regular expression to check if string is a valid IPv4 address
  const regExp =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regExp.test(addr);
};

export { extractLabelValue, getIPv4InternalIP, isIPv4 };
