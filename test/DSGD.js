// TODO: Improve coverage
// Tests here are for the sole purpose of collecting gas info

const { ethers } = require('hardhat');
const { dsgdAmount } = require('./helpers');
const { initDsgd } = require('./fixtures/dsgd');

describe('DSGD', () => {
  describe('transactions', () => {
    it('should be able to transfer tokens', async () => {
      const { dsgdToken, dsgdDeployer } = await initDsgd();

      // Mint
      const [, random1, random2] = await ethers.getSigners();
      await dsgdToken.connect(dsgdDeployer).mint(random1.address, dsgdAmount(10));

      // Transfer
      await dsgdToken.connect(random1).transfer(random2.address, dsgdAmount(10));
    });

    it('should be able to able to approve and transfer from', async () => {
      const { dsgdToken, dsgdDeployer } = await initDsgd();

      // Mint
      const [, random1, random2, random3] = await ethers.getSigners();
      await dsgdToken.connect(dsgdDeployer).mint(random1.address, dsgdAmount(10));

      // Transfer from 1 -> 3 via 2
      await dsgdToken.connect(random1).approve(random2.address, dsgdAmount(1));
      await dsgdToken.connect(random2).transferFrom(random1.address, random3.address, dsgdAmount(1));
    });
  });
});
