using './main.bicep'

// Dev defaults — override per dev RG as needed. NOTHING secret lives here:
// no key, no connection string, no SAS (the keyless contract has no such inputs).
param namePrefix = 'agorademo'
// location defaults to the resource group's location; uncomment to pin one.
// param location = 'eastus2'
param storageSku = 'Standard_LRS'
param principalType = 'ServicePrincipal'
