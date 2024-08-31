// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet'
import React, { useState } from 'react'
import AppCalls from './components/AppCalls'
import ConnectWallet from './components/ConnectWallet'
import CreateCrowdFund from './components/CreateCrowdFund'
import InteractWithCrowdFund from './components/InteractWithCrowdFund'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [createModal, setCreateModal] = useState(false);
  const [interactModal, setInteractModal] = useState(false);
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleInteractModal = () => {
    setInteractModal(!interactModal)
  }

  const toggleCreateModal = () => {
    setCreateModal(!createModal)
  };

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">CrowdFund 🙂</div>
          </h1>

          <br />

          <div className="grid">
              {!!activeAddress && (
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleCreateModal}>
                  Create Crowdfund
                </button>
              )}

              {!!activeAddress && (
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleInteractModal}>
                  Connect to existing crowd-fund
                </button>
              )}
              

              <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
                Wallet Connection
              </button>
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
          <CreateCrowdFund openModal={createModal} setModalState={toggleCreateModal} />
          <InteractWithCrowdFund openModal={interactModal} setModalState={toggleInteractModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
