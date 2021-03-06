// Hosting using OrbitDB. Proof-of-concept, not compatible with testnet yet.
// Will be enabled when IPFS is supported by Ocean.

const data = require('./output.json')
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const fs = require('fs')

const ipfsOptions = {
  start: true,
  EXPERIMENTAL: {
    pubsub: true,
  },
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ]
    },
  }
}

const ipfs = new IPFS(ipfsOptions)

ipfs.on('error', (e) => console.error(e))

ipfs.on('ready', async () => {

  const orbitdb = new OrbitDB(ipfs)

  const db = await orbitdb.docs(new Date().toISOString(), {
    create: true,
    overwrite: true,
    localOnly: false,
    //write: ['*'], // ALLOW ALL WRITE
  })

  await db.load()

  // async forEach withon the IPFS on ready is problematic, put manually
  await db.put( { _id: 'data', array: data.data })
  await db.put( { _id: 'cluster', array: data.cluster })
  await db.put( { _id: 'centroids', array: data.centroids })

  const it = db.get('data')
  console.log(it)
  // Once database is filled write address to JSON
  fs.writeFileSync('host.json', JSON.stringify({"address": db.address.toString()}))

  // Close and exit
  await orbitdb.disconnect()
  await ipfs.stop(() => {})
  process.exit()

})
