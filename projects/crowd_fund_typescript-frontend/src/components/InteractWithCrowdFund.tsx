import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { useWallet } from '@txnlab/use-wallet'
import { makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { CrowdFundClient } from '../contracts/CrowdFundClient'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const InteractWithCrowdFund = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [beneficiary, setBeneficiary] = useState<string>('')
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [appId, setAppId] = useState('');
  const [temporaryAppId, setTemporaryAppId] = useState('');
  const [gettingTarget, setGettingTarget] = useState<boolean>(false);
  const [gettingCurrentAmount, setGettingCurrentAmount] = useState<boolean>(false);
  const [gettingBeneficiary, setGettingBeneficiary] = useState<boolean>(false);
  const [makingContribution, setMakingContribution] = useState<boolean>(false);

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  })

  const { enqueueSnackbar } = useSnackbar()
  const { signer, activeAddress } = useWallet()

  const sendAppCall = async () => {
    setLoading(true)

    // Please note, in typical production scenarios,
    // you wouldn't want to use deploy directly from your frontend.
    // Instead, you would deploy your contract on your backend and reference it by id.
    // Given the simplicity of the starter contract, we are deploying it on the frontend
    // for demonstration purposes.
    const appClient = new CrowdFundClient(
      {
        sender: { signer, addr: activeAddress } as TransactionSignerAccount,
        resolveBy: 'id',
        id: 0,
      },
      algodClient,
    )
    
    await appClient.create.createApplication({
      targetAmount,
      beneficiary
    }).then((val) => {
      enqueueSnackbar(`Contract ID: ${val.appId}`, { variant: 'success' })
      enqueueSnackbar(`Contract address: ${val.appAddress}`, { variant: 'success' })
      console.log(`Contract ID: ${val.appId}\nContract address: ${val.appAddress}`);
    }).catch((e: Error) => {
      enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    });

    setLoading(false)
  }

  const viewTarget = async () => {
    setGettingTarget(true)

    const appClient = generateClient()
    
    await appClient.viewTargetAmount({}).then((val) => {
      enqueueSnackbar(`The target amount is ${val.return?.valueOf()}`, { variant: 'success' })
    }).catch((e: Error) => {
      enqueueSnackbar(`Error getting the target amount: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    });

    setGettingTarget(false)
  }

  const viewCurrentAmount = async () => {
    setGettingCurrentAmount(true)

    const appClient = generateClient()
    
    await appClient.viewCurrentAmount({}).then((val) => {
      enqueueSnackbar(`The current amount is ${val.return?.valueOf()}`, { variant: 'success' })
    }).catch((e: Error) => {
      enqueueSnackbar(`Error getting the current amount: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    });

    setGettingCurrentAmount(false)
  }

  const viewBeneficiaries = async () => {
    setGettingBeneficiary(true)

    const appClient = generateClient()
    
    await appClient.viewBeneficiary({}).then((val) => {
      enqueueSnackbar(`The beneficiary of the crowd fund is ${val.return?.valueOf()}`, { variant: 'success' })
    }).catch((e: Error) => {
      enqueueSnackbar(`Error getting the beneficiary: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    });

    setGettingBeneficiary(false)
  }

  const generateClient = () => {
    return new CrowdFundClient(
      {
        sender: { signer, addr: activeAddress } as TransactionSignerAccount,
        resolveBy: 'id',
        id: Number(appId),
      },
      algodClient,
    )
  };

  const makeContribution = async () => {
    setMakingContribution(true)

    const appClient = generateClient();

    const state = await appClient.appClient.getAppReference();
    const smartContractAddress = state.appAddress;

    console.log(smartContractAddress);

    const suggestedParams = await algokit.getTransactionParams(undefined, algodClient);
    // const appInformation = await algokit.getAppById(Number(appId), algodClient);
    // const smartContractAddress = 'QBGPLHBAC2EIMCBH6P7PTA3GX73HKMXREH5TDOY6GIEHC2INV27GNK3C5Q'
    // console.log(appInformation);
    let amount = 0;

    while (amount <= 0 || isNaN(amount)) {
      amount = parseInt(prompt('Enter the amount you want to contribute') || '0');
    }

    // await appClient.appClient.fundAppAccount({ amount: algokit.microAlgos(200_000) });

    // const mbrTransaction = makePaymentTxnWithSuggestedParamsFromObject({
    //   from: activeAddress || '',
    //   to: smartContractAddress,
    //   amount: 1,
    //   suggestedParams,
    // });

    // await algokit.sendTransaction({
    //   transaction: mbrTransaction,
    //   from: { signer, addr: activeAddress } as TransactionSignerAccount,
    // }, algodClient)

    const sendTransaction = makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress || '',
      to: smartContractAddress,
      amount,
      suggestedParams,
    });
    
    await appClient.payIntoCrowdFund({
      paymentTxn: {
        transaction: sendTransaction,
        signer: { signer, addr: activeAddress } as TransactionSignerAccount
    }},{
      sendParams: {
        fee: algokit.microAlgos(200_000),
      }
    }).then((val) => {
      enqueueSnackbar(`Contribution successful`, { variant: 'success' })
    }).catch((e: Error) => {
      enqueueSnackbar(`Error making contribution: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    });

    setMakingContribution(false)
  };

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        {appId ? (
          <>
            <h3 className="font-bold text-lg">Interact with your crowd fund: {appId}</h3>
            <br />
            <button className="btn" onClick={viewTarget}>
              {gettingTarget ? "Getting fund target..." : 'View crowd fund target'}
            </button>
            <br/>
            <br/>
            <button className="btn" onClick={viewCurrentAmount}>
              {gettingCurrentAmount ? "Getting current amount..." : 'View current amount'}
            </button>
            <br/>
            <br/>
            <button className="btn" onClick={makeContribution}>
              {makingContribution ? "Making contribution..." : 'Make contribution'}
            </button>
            <br/>
            <br/>
            <button className="btn" onClick={viewBeneficiaries}>
              {gettingBeneficiary ? "Getting beneficiary..." : 'View beneficiary'}
            </button>
            
            <div className="modal-action ">
              <button className="btn" onClick={() => setModalState(!openModal)}>
                Close
              </button>
              <button 
                disabled={!appId}
                className={`btn`} 
                onClick={() => {
                  setAppId('');
                }}
              >
                {loading ? <span className="loading loading-spinner" /> : 'Disconnect from crowd fund'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-bold text-lg">Provide the APP ID for your crowd fund</h3>
            <br />
            <input
              type="text"
              placeholder="Provide the ID of the crowd fund"
              className="input input-bordered w-full"
              value={temporaryAppId}
              onChange={(e) => {
                setTemporaryAppId(e.target.value)
              }}
            />
            
            <div className="modal-action ">
              <button className="btn" onClick={() => setModalState(!openModal)}>
                Close
              </button>
              <button 
                disabled={!temporaryAppId}
                className={`btn`} 
                onClick={() => {
                  setAppId(temporaryAppId);
                  setTemporaryAppId('');
                }}
              >
                {loading ? <span className="loading loading-spinner" /> : 'Connect to crowd fund'}
              </button>
            </div>
          </>
        )}
        
      </form>
    </dialog>
  )
}

export default InteractWithCrowdFund;

// QBGPLHBAC2EIMCBH6P7PTA3GX73HKMXREH5TDOY6GIEHC2INV27GNK3C5Q
// 1687
