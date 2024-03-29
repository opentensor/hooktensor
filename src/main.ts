//import './interfaces/augment-api';
//import './interfaces/augment-types';
import '@polkadot/api-augment';
import { ApiPromise } from "@polkadot/api/promise/Api";
import { WsProvider }  from "@polkadot/rpc-provider/ws";
import { formatBalance } from '@polkadot/util';
import { NeuronInfoLite, SubnetInfo } from './interfaces';
import axios from "axios";

const block_time = 12; // seconds
const difficultyFormatter = Intl.NumberFormat('en', { notation: 'compact', maximumSignificantDigits: 2 });
const balanceFormatter = (balance_num: number) => formatBalance(
  balance_num,
  { withSi: false, forceUnit: 'TAO', decimals: 9 }
);
const halving_block = 10.5e6; // block 10.5M is the halvening

function get_provider_from_url(url: string): WsProvider  {
    const provider = new WsProvider(url);
    return provider;
}

async function get_api_from_url(url: string): Promise<ApiPromise> {
    const provider = get_provider_from_url(url);
    const api = await ApiPromise.create({
        types: {
          Balance: 'u64',
          PrometheusInfo: {
            block: 'u64', // --- Prometheus serving block.
            version: 'u32', // --- Prometheus version.
            ip: 'u128', // --- Prometheus u128 encoded ip address of type v6 or v4. serialized to string.
            port: 'u16', // --- Prometheus u16 encoded port.
            ip_type: 'u8', // --- Prometheus ip type, 4 for ipv4 and 6 for ipv6.
          },
          AxonInfo: {
            block: 'u64', // --- Axon serving block.
            version: 'u32', // --- Axon version
            ip: 'u128', // --- Axon u128 encoded ip address of type v6 or v4. serialized to string.
            port: 'u16', // --- Axon u16 encoded port.
            ip_type: 'u8', // --- Axon ip type, 4 for ipv4 and 6 for ipv6.
            protocol: 'u8', // --- Axon protocol. TCP, UDP, other.
            placeholder1: 'u8', // --- Axon proto placeholder 1.
            placeholder2: 'u8', // --- Axon proto placeholder 1.
          },
          NeuronInfo: {
            hotkey: 'AccountId',
            coldkey: 'AccountId',
            uid: 'Compact<u16>',
            netuid: 'Compact<u16>',
            active: 'bool',
            axon_info: 'AxonInfo',
            prometheus_info: 'PrometheusInfo',
            stake: 'Vec<(AccountId, Compact<u64>)>', // map of coldkey to stake on this neuron/hotkey (includes delegations)
            rank: 'Compact<u16>',
            emission: 'Compact<u64>',
            incentive: 'Compact<u16>',
            consensus: 'Compact<u16>',
            trust: 'Compact<u16>',
            validator_trust: 'Compact<u16>',
            dividends: 'Compact<u16>',
            last_update: 'Compact<u64>',
            validator_permit: 'bool',
            weights: 'Vec<(Compact<u16>, Compact<u16>)>', // Vec of (uid, weight)
            bonds: 'Vec<(Compact<u16>, Compact<u16>)>', // Vec of (uid, bond)
            pruning_score: 'Compact<u16>'
          },
          NeuronInfoLite: {
            hotkey: 'AccountId',
            coldkey: 'AccountId',
            uid: 'Compact<u16>',
            netuid: 'Compact<u16>',
            active: 'bool',
            axon_info: 'AxonInfo',
            prometheus_info: 'PrometheusInfo',
            stake: 'Vec<(AccountId, Compact<u64>)>', // map of coldkey to stake on this neuron/hotkey (includes delegations)
            rank: 'Compact<u16>',
            emission: 'Compact<u64>',
            incentive: 'Compact<u16>',
            consensus: 'Compact<u16>',
            trust: 'Compact<u16>',
            validator_trust: 'Compact<u16>',
            dividends: 'Compact<u16>',
            last_update: 'Compact<u64>',
            validator_permit: 'bool',
            pruning_score: 'Compact<u16>'
          },
          DelegateInfo: {
            delegate_ss58: 'AccountId',
            take: 'Compact<u16>',
            nominators: 'Vec<(AccountId, Compact<u64>)>', // map of nominator_ss58 to stake amount
            owner_ss58: 'AccountId',
            registrations: 'Vec<Compact<u16>>', // Vec of netuid this delegate is registered on
            validator_permits: 'Vec<Compact<u16>>', // Vec of netuid this delegate has validator permit on
            return_per_1000: 'Compact<u64>', // Delegators current daily return per 1000 TAO staked minus take fee
            total_daily_return: 'Compact<u64>', // Delegators current daily return
          },
          SubnetInfo: {
            netuid: 'Compact<u16>',
            rho: 'Compact<u16>',
            kappa: 'Compact<u16>',
            difficulty: 'Compact<u64>',
            immunity_period: 'Compact<u16>',
            validator_batch_size: 'Compact<u16>',
            validator_sequence_length: 'Compact<u16>',
            validator_epochs_per_reset: 'Compact<u16>',
            validator_epoch_length: 'Compact<u16>',
            max_allowed_validators: 'Compact<u16>',
            min_allowed_weights: 'Compact<u16>',
            max_weights_limit: 'Compact<u16>',
            scaling_law_power: 'Compact<u16>',
            synergy_scaling_law_power: 'Compact<u16>',
            subnetwork_n: 'Compact<u16>',
            max_allowed_uids: 'Compact<u16>',
            blocks_since_last_step: 'Compact<u64>',
            tempo: 'Compact<u16>',
            network_modality: 'Compact<u16>',
            network_connect: 'Vec<[u16; 2]>',
            emission_values: 'Compact<u64>',
            burn: 'Compact<u64>',
          }
        },
        rpc: {
          neuronInfo: {
            getNeuronsLite: {
              description: 'Get neurons lite',
              params: [
                {
                  name: 'netuid',
                  type: 'u16',
                }
              ],
              type: 'Vec<u8>',
            },
            getNeuronLite: {
              description: 'Get neuron lite',
              params: [
                {
                  name: 'netuid',
                  type: 'u16',
                },
                {
                  name: 'uid',
                  type: 'u16',
                }
              ],
              type: 'Vec<u8>',
            },
            getNeurons: {
              description: 'Get neurons',
              params: [
                {
                  name: 'netuid',
                  type: 'u16',
                }
              ],
              type: 'Vec<u8>',
            },
            getNeuron: {
              description: 'Get neuron',
              params: [
                {
                  name: 'netuid',
                  type: 'u16',
                },
                {
                  name: 'uid',
                  type: 'u16',
                }
              ],
              type: 'Vec<u8>',
            },
          },
          delegateInfo: {
            getDelegates: {
              description: 'Get delegates info',
              params: [],
              type: 'Vec<u8>',
            },
          },
          subnetInfo: {
            getSubnetsInfo: {
              description: 'Get subnets info',
              params: [],
              type: 'Vec<u8>',
            },
            getSubnetInfo: {
              description: 'Get subnet info',
              params: [
                {
                  name: 'netuid',
                  type: 'u16',
                }
              ],
              type: 'Vec<u8>',
            },
          },
        },
        provider: provider,
      });
    return api;
}

async function getNeurons(api: ApiPromise, netuid: number): Promise<NeuronInfoLite[]> {
    return new Promise((resolve, reject) => {
      (api.rpc as any).neuronInfo.getNeuronsLite(netuid)
      .then((neurons_bytes: any) => {
        let neurons = api.createType('Vec<NeuronInfoLite>', neurons_bytes) as any;
        resolve(neurons.toJSON() as NeuronInfoLite[]);
      })
      .catch((err: any) => {
        console.log(err)
        reject(err);
      });
    })
};

async function getDifficulties(api: ApiPromise): Promise<{ [key: string]: number}> {
    const netuids = await getNetuids(api);
    let difficulty: { [key: string]: number} = {};
    for (let netuid of netuids) {
        const diff = (await (api.query.subtensorModule as any).difficulty(netuid)).toNumber();
        difficulty[netuid.toString()] = diff;
    }
    return difficulty;
}

async function getDifficulty(api: ApiPromise, netuid: number): Promise<number> {
  return (await (api.query.subtensorModule as any).difficulty(netuid)).toNumber();
}

async function getBurnAmounts(api: ApiPromise): Promise<{ [key: string]: number}> {
  const netuids = await getNetuids(api);
  let burn_amounts: { [key: string]: number} = {};
  for (let netuid of netuids) {
      const diff = (await (api.query.subtensorModule as any).burn(netuid)).toNumber();
      burn_amounts[netuid.toString()] = diff;
  }
  return burn_amounts;
}

async function getBurnAmount(api: ApiPromise, netuid: number): Promise<number> {
  return (await (api.query.subtensorModule as any).burn(netuid)).toNumber();
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

interface NeuronData {
    hotkey: string;
    coldkey: string;
    uid: number;
}

async function getNetuids(api: ApiPromise): Promise<number[]> {
    let subnets_info_bytes = await (api.rpc as any).subnetInfo.getSubnetsInfo();
    let subnets_info = api.createType('Vec<Option<SubnetInfo>>', subnets_info_bytes) as any;
    let netuids: number[] = subnets_info.toJSON().map((subnet_info: SubnetInfo) => subnet_info.netuid as number);
    return netuids;
}

async function refreshMeta(api: ApiPromise): Promise<Meta> {
    let _neurons: Meta = {};
    let netuids = await getNetuids(api);
    
    for (let i = 0; i < netuids.length; i++) {
        const result = await getNeurons(api, netuids[i])
        let neurons_: NeuronData[] = result.map((neuron, j) => {
            return {
                hotkey: neuron.hotkey.toString(),
                coldkey: neuron.coldkey.toString(),
                uid: j
            };
        });
        _neurons[netuids[i].toString()] = neurons_;
    }
    
    return _neurons;
}

async function post_to_webhook(webhook_url: string, message: string) {
    if (webhook_url == "") {
        // log to console instead
        console.log(message);
        return;
    }

    try {
        const result = await axios.post(
            webhook_url,
            {
                content: message
            }
        );  
        if (result.status !== 204) {
            console.error(result);
            throw new Error("Failed to post to webhook");
        }
        console.log("Successfully posted to webhook");
    } catch (error) {
        console.error(error);
    }
}

interface Diff {
    new_coldkey: string;
    new_hotkey: string;
    old_coldkey: string;
    old_hotkey: string;
    uid: number;
    netuid: string;
}

function getMessage(diff: Diff): string {
    const message = `Neuron (${diff.netuid}; ${diff.uid})\n` +
        `   New hotkey:\`${diff.new_hotkey}\`\n` +
        `   New coldkey:\`${diff.new_coldkey}\`\n` +
        `   Old hotkey:\`${diff.old_hotkey}\`\n` +
        `   Old coldkey:\`${diff.old_coldkey}\``;
    return message;
}

interface Meta {
    [key: string]: NeuronData[]; // netuid -> NeuronData[]
}

function getBestAdjustmentInterval(intervals: number[]): number {
  const gcd = (...arr: any[]) => {
    const _gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y));
    return [...arr].reduce((a, b) => _gcd(a, b));
  };

  return gcd(...intervals);
}

async function watchForEpoch(api: ApiPromise, webhook_url: string) {
    let current_block: number = 0;
    let lastMechansimStepBlock: number = 0;
    console.log("Getting initial epoch info...");
    let netuid = 3;
    const blocksPerStep: number = ((await api.query.subtensorModule.tempo(netuid)) as any).toNumber();
    current_block = (await (api.rpc as any).chain.getHeader()).number.toNumber();
    lastMechansimStepBlock = (await api.query.subtensorModule.lastMechansimStepBlock(netuid) as any).toNumber();
    console.log("Done getting initial epoch info");

    const blocks_till_next_epoch = blocksPerStep - (current_block - lastMechansimStepBlock);
    await sleep(blocks_till_next_epoch * block_time * 1000); // sleep until next epoch

    setInterval(async () => {
        console.log("Getting current block...");
        current_block = (await (api.rpc as any).chain.getHeader()).number.toNumber();
        console.log(`Current block: ${current_block}`);
        if (current_block - lastMechansimStepBlock >= blocksPerStep) {
            console.log("New epoch!");
            // update lastMechansimStepBlock
            lastMechansimStepBlock = (await api.query.subtensorModule.lastMechansimStepBlock(netuid) as any).toNumber();
            console.log("Posting to webhook...");
            const blocks_per_day  = (24 * 60 * 60) / block_time; // seconds per day / block time
            const days_until = (halving_block - current_block) / blocks_per_day;
            let message = "New network epoch!\n" +
                `Current block: ${lastMechansimStepBlock}\n` +
                `Days until next halving: ${difficultyFormatter.format(days_until)}`;

            post_to_webhook(
                webhook_url,
                message
            );
        }
    }, blocksPerStep * block_time * 1000); // check every epoch
}


async function subscribeToDifficulty(api: ApiPromise, netuid: number, webhook_url: string): Promise<any> {
  console.log(`Subscribing to difficulty for netuid ${netuid}`);

  let current_difficulty = await getDifficulty(api, netuid);

  const unsub = await api.query.subtensorModule.difficulty(netuid, (difficulty: any) => {
    const new_difficulty = difficulty.toNumber();
    if (new_difficulty !== current_difficulty) {
      console.log("Difficulty changed for netuid " + netuid);
      const old_diff_formatted = difficultyFormatter.format(current_difficulty);

      console.info(`New difficulty: ${difficultyFormatter.format(new_difficulty)}`);
      console.info("Posting to webhook...");
      let message = `(Netuid ${netuid}) - :pick: Difficulty changed from ${old_diff_formatted || "None"} to ${difficultyFormatter.format(new_difficulty)}`;
      post_to_webhook(
          webhook_url,
          message
      );
    }

    current_difficulty = new_difficulty;
  });

  return unsub;
}

async function watchForDifficulty(api: ApiPromise, webhook_url: string): Promise<any[]> {
    const netuids = await getNetuids(api);

    const unsubscribes = await Promise.all(netuids.map(async (netuid) => {
        return await subscribeToDifficulty(api, netuid, webhook_url);
    }));

    return unsubscribes;
}

async function subscribeToBurnAmount(api: ApiPromise, netuid: number, webhook_url: string): Promise<any> {
    console.log(`Subscribing to burn amount for netuid ${netuid}`);

    let old_burn_amount = await getBurnAmount(api, netuid);
    
    const unsub = await api.query.subtensorModule.burn(netuid, (burnAmount: any) => {
        const new_burn_amount = burnAmount.toNumber();

        if (new_burn_amount !== old_burn_amount) {

          const old_as_balance = balanceFormatter(old_burn_amount);

          console.info("Burn amount changed for netuid " + netuid);
          console.info(`New burn amount: ${burnAmount} TAO`);
          console.info("Posting to webhook...");
          let message = `(Netuid ${netuid}) - :recycle: Recycle Amount changed from ${old_as_balance || "None"} \u03C4 to ${balanceFormatter(burnAmount)} \u03C4`;
          post_to_webhook(
              webhook_url,
              message
          );
        }

        old_burn_amount = new_burn_amount;
    });

    return unsub;
}
 
async function watchForBurnAmount(api: ApiPromise, webhook_url: string): Promise<any[]>{
  const netuids = await getNetuids(api);

  const unsubscribes = await Promise.all(netuids.map(async (netuid) => {
      return await subscribeToBurnAmount(api, netuid, webhook_url);
  }));

  return unsubscribes;
}

export async function watch(url: string, webhook_url: string, interval: number) {
    let api = await get_api_from_url(url);
    let current_meta: Meta;

    // Wait for the API to be connected to the node
    try {
        await api.isReady;
    } catch (err) {
        console.log(err);
        return;
    }
    console.log("Connected to entrypoint");
    console.log("Pulling initial metagraph...");
    current_meta = await refreshMeta(api);
    console.log("Done...");

    // Start watching for difficulty changes
    let unsubscribes_diff = await watchForDifficulty(api, webhook_url);
    let unsubscribes_burn = await watchForBurnAmount(api, webhook_url);

    let new_netuid = null;
    // watch for changes in metagraph to detect registration changes
    while (true) {
        if (new_netuid !== null) {
          let unsub_burn = subscribeToBurnAmount(api, parseInt(new_netuid), webhook_url);
          let unsub_diff = subscribeToDifficulty(api, parseInt(new_netuid), webhook_url);

          unsubscribes_burn.push(unsub_burn);
          unsubscribes_diff.push(unsub_diff);
          
          new_netuid = null;
        }
  
        console.log(`Sleeping for ${interval/1000} seconds`);
        await sleep(interval);
        console.log("Checking for changes...");
        console.log("Pulling new metagraph...");
        let new_meta = await refreshMeta(api);
        console.log("Done...");
        
        const diff: Diff[] = [];
        for (let netuid in new_meta) {
          if (current_meta[netuid] === undefined) {
            // new netuid
            new_netuid = netuid;
            let message = `New netuid ${netuid} registered`;
            post_to_webhook(
              webhook_url,
              message
            );
            current_meta[netuid] = new_meta[netuid];
          } else {
            for (let uid: number = 0; uid < new_meta[netuid].length; uid++) {
                if (current_meta[netuid][uid]?.hotkey !== new_meta[netuid][uid].hotkey) {
                    // hotkey changed
                    let diff_ = {
                        netuid: netuid,
                        uid: uid,
                        old_hotkey: current_meta[netuid][uid]?.hotkey || "None",
                        new_hotkey: new_meta[netuid][uid].hotkey,
                        old_coldkey: current_meta[netuid][uid]?.coldkey || "None",
                        new_coldkey: new_meta[netuid][uid].coldkey,
                    };
                    diff.push(diff_);
                }
            }
          }
        }
        console.info(`Found ${diff.length} changes`);
        if (diff.length > 0) {
            console.info("Posting to webhook...");
        }
        diff.forEach(diff_ => {
            let message = getMessage(diff_);
            post_to_webhook(
                webhook_url,
                message
            );
        });

        current_meta = new_meta;
    }

}