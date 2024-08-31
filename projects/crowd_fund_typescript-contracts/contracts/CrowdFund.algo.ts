import { Contract } from '@algorandfoundation/tealscript';

export class CrowdFund extends Contract {
  beneficiary = GlobalStateKey<Address>();

  targetAmount = GlobalStateKey<uint64>();

  currentAmount = GlobalStateKey<uint64>();

  crowdFundOngoing = GlobalStateKey<boolean>();

  createApplication(targetAmount: uint64, beneficiary: Address): void {
    this.targetAmount.value = targetAmount;
    this.beneficiary.value = beneficiary;
    this.crowdFundOngoing.value = true;
  }

  payIntoCrowdFund(paymentTxn: PayTxn): void {
    assert(this.crowdFundOngoing.value, 'The crowd fund has to be ongoing');
    assert(paymentTxn.receiver === this.app.address, 'The receiver has to be the smart contract address');
    assert(paymentTxn.amount > 0, 'The amount has to be greater than 0');
    assert(paymentTxn.sender === this.txn.sender, 'The sender has to be the same as the transaction sender');
    assert(
      this.currentAmount.value + paymentTxn.amount <= this.targetAmount.value,
      'The amount has to be less than the target amount'
    );

    this.currentAmount.value = this.currentAmount.value + paymentTxn.amount;

    if (this.currentAmount.value >= this.targetAmount.value) {
      this.terminateContract();
    }
  }

  triggerWithdrawal(): void {
    assert(this.txn.sender === this.app.creator, 'Only the creator can trigger the withdrawal');
    assert(this.crowdFundOngoing.value, 'The crowd fund has to be ongoing');

    this.terminateContract();
  }

  private terminateContract(): void {
    this.crowdFundOngoing.value = false;

    sendPayment({
      // amount: this.app.address.balance,
      receiver: this.beneficiary.value,
      sender: this.app.address,
      closeRemainderTo: this.beneficiary.value,
    });
  }

  viewTargetAmount(): uint64 {
    return this.targetAmount.value;
  }

  viewCurrentAmount(): uint64 {
    return this.currentAmount.value;
  }

  viewBeneficiary(): Address {
    return this.beneficiary.value;
  }
}
