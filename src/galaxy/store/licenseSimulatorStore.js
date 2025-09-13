import eventify from 'ngraph.events';

function createLicenseSimulatorStore() {
  let selectedLicense = null;

  const api = {
    setSelectedLicense: (license) => {
      selectedLicense = license;
      api.fire('changed');
    },
    getSelectedLicense: () => selectedLicense
  };

  eventify(api);
  return api;
}

const licenseSimulatorStore = createLicenseSimulatorStore();
export default licenseSimulatorStore;