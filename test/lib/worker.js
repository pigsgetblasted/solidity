
'use strict'

const EventEmitter = require('events'),
  worker_threads = require('worker_threads');

const {ethers} = require("hardhat");

class Worker extends EventEmitter{
  index     = 0;
  increment = 1;
  isRunning = false;
  name;

  static id = 1;

  constructor(){
    //setup / initialize event listener
    super()

    this.name = Worker.id++;

    //listen for messages from Parent
    worker_threads.parentPort.on( 'message', this.handleMessage.bind( this ) )
  }

  //ref: https://nodejs.org/api/worker_threads.html#worker_threads_class_worker
  static threaded(){
    //both Parent and Worker (child) will execute __filename
    //See line 56: use `worker_threads.isMainThread` handle setup
    return new worker_threads.Worker(__filename);
  }

  handleMessage(evt){
    console.debug(`Worker(${this.name}): received `+ JSON.stringify(evt, null, 2));

    if(evt?.type === 'name'){
      console.warn(`Worker(${this.name}): name`);
      this.name = evt.value;
    }
    else if(evt?.type === 'start'){
      console.info(`Worker(${this.name}): start`);

      this.index     = evt.index;
      this.increment = evt.increment;
      this.isRunning = true;
      this.process();
    }
    else if(evt?.type === 'stop'){
      console.info(`Worker(${this.name}): stop`);
      this.isRunning = false;
    }
    else{
      console.warn(`Worker(${this.name}): unhandled event `+ JSON.stringify(evt, null, 2));
    }
  }

  async process(){
    try{
      await this._process();
    }
    catch(err){
      console.error(err);
    }
  }

  async _process(){
    let concat;
    let concatHashWord;
    const mintPassSlot = 4;
    for(let accountIndex = this.index; accountIndex < Number.MAX_SAFE_INTEGER; accountIndex += this.increment){
      if(this.isRunning){
        // await new Promise(resolve => setTimeout(resolve, 1000));

        concat = '0x'
          + accountIndex.toString(16).padStart(64, '0')
          + mintPassSlot.toString(16).padStart(64, '0');

        concatHashWord = ethers.utils.keccak256(concat);
        worker_threads.parentPort.postMessage({
          accountIndex,
          from:  this.name,
          slot:  mintPassSlot,
          type: 'keccak256',
          value: concatHashWord,
        });
      }
      else{
        break;
      }
    }
  }
}

if( worker_threads.isMainThread ){
  //Parent code: (none)
}
else{
  //Worker code:
  new Worker();
}

module.exports = Worker
