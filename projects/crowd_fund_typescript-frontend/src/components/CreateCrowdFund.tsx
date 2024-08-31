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

const CreateCrowdFund = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [beneficiary, setBeneficiary] = useState<string>('')
  const [targetAmount, setTargetAmount] = useState<number>(0);

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

    let appAddress = '';
    
    await appClient.create.createApplication({
      targetAmount,
      beneficiary
    }).then((val) => {
      enqueueSnackbar(`Contract ID: ${val.appId}`, { variant: 'success' })
      enqueueSnackbar(`Contract address: ${val.appAddress}`, { variant: 'success' })
      appAddress = val.appAddress;
      console.log(`Contract ID: ${val.appId}\nContract address: ${val.appAddress}`);
    }).catch((e: Error) => {
      enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    });

    const suggestedParams = await algokit.getTransactionParams(undefined, algodClient);
    const sendTransaction = makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress || '',
      to: appAddress,
      amount: 1,
      suggestedParams,
    });

    await algokit.sendTransaction({
      transaction: sendTransaction,
      from: { signer, addr: activeAddress } as TransactionSignerAccount,
    }, algodClient)

    setLoading(false)
  }

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg">Provide the parameters for your crowd fund</h3>
        <br />
        <input
          type="text"
          placeholder="Provide the address of your beneficiary"
          className="input input-bordered w-full"
          value={beneficiary}
          onChange={(e) => {
            setBeneficiary(e.target.value)
          }}
        />
        <button onClick={() => setBeneficiary(activeAddress || '')}>Use own address</button>
        <br />
        <br />
        <input
          type="number"
          placeholder="Provide the target amount"
          className="input input-bordered w-full"
          value={targetAmount}
          onChange={(e) => {
            setTargetAmount(parseInt(e.target.value || '0'))
          }}
        />
        <div className="modal-action ">
          <button className="btn" onClick={() => setModalState(!openModal)}>
            Close
          </button>
          <button 
            disabled={!beneficiary || !targetAmount}
            className={`btn`} 
            onClick={sendAppCall}
          >
            {loading ? <span className="loading loading-spinner" /> : 'Create crowd fund'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default CreateCrowdFund;

// QBGPLHBAC2EIMCBH6P7PTA3GX73HKMXREH5TDOY6GIEHC2INV27GNK3C5Q
// 1687
