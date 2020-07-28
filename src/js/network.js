import { EventEmitter } from './eventEmitter'
import validators from 'types-validate-assert'
const { validateTypes } = validators;
import { LamdenMasterNode_API } from './masternode-api'

export class Network {
    // Constructor needs an Object with the following information to build Class.
    //
    // networkInfo: {
    //      hosts: <array> list of masternode hostname/ip urls,
    //      type: <string> "testnet", "mainnet" or "mockchain"
    //  },
    constructor(networkInfoObj){
        const lamdenNetworkTypes = ['mockchain', 'testnet', 'mainnet']
        //Reject undefined or missing info
        if (!validateTypes.isObjectWithKeys(networkInfoObj)) throw new Error(`Expected Network Info Object and got Type: ${typeof networkInfoObj}`)
        if (!validateTypes.isArrayWithValues(networkInfoObj.hosts)) throw new Error(`HOSTS Required (Type: Array)`)
        if (!validateTypes.isStringWithValue(networkInfoObj.type)) throw new Error(`Network Type Required (Type: String)`)

        this.type = networkInfoObj.type.toLowerCase();
        this.events = new EventEmitter()
        this.hosts = this.validateHosts(networkInfoObj.hosts);
        this.currencySymbol = validateTypes.isStringWithValue(networkInfoObj.currencySymbol) ? networkInfoObj.currencySymbol : 'TAU'
        this.name = validateTypes.isStringWithValue(networkInfoObj.name) ? networkInfoObj.name : 'lamden network';
        this.lamden = validateTypes.isBoolean(networkInfoObj.lamden) ? networkInfoObj.lamden : false;
        this.blockExplorer = validateTypes.isStringWithValue(networkInfoObj.blockExplorer) ? networkInfoObj.blockExplorer : undefined;
    
        this.online = false;
        try{
            this.API = new LamdenMasterNode_API(networkInfoObj)
        } catch (e) {
            throw new Error(e)
        }
        
        if (!lamdenNetworkTypes.includes(this.type)) {
            throw new Error(`${this.type} not in Lamden Network Types: ${JSON.stringify(lamdenNetworkTypes)}`)
        }
        
        this.mainnet = this.type === 'mainnet'
        this.testnet = this.type === 'testnet'
        this.mockchain = this.type === 'mockchain'

    }
    //This will throw an error if the protocol wasn't included in the host string
    vaidateProtocol(host){
        let protocols = ['https://', 'http://']
        if (protocols.map(protocol => host.includes(protocol)).includes(true)) return host
        throw new Error('Host String must include http:// or https://')
    }
    validateHosts(hosts){
        return hosts.map(host => this.vaidateProtocol(host.toLowerCase()))
    }
    //Check if the network is online
    //Emits boolean as 'online' event
    //Also returns status as well as passes status to a callback
    async ping(callback = undefined){
        this.online = await this.API.pingServer()
        this.events.emit('online', this.online);
        if (validateTypes.isFunction(callback)) callback(this.online)
        return this.online
    }
    get host() {return this.hosts[Math.floor(Math.random() * this.hosts.length)]}
    get url() {return this.host}
    getNetworkInfo(){
        return {
            name: this.name,
            lamden: this.lamden,
            type: this.type,
            hosts: this.hosts,
            url: this.url,
            online: this.online,
            mainnet: this.mainnet,
            testnet: this.testnet,
            mockchain: this.mockchain
        }
    }
}