const CryptoZombies = artifacts.require("CryptoZombies");
const Kitty = artifacts.require("Kitty");
const utils = require("./helpers/utils");
const time = require("./helpers/time");
const zombieNames = ["Zombie 1", "Zombie 2"];
contract("CryptoZombies", (accounts) => {
    let [alice, bob] = accounts;
    let contractInstance;
    let kittyInstance;
    beforeEach(async () => {
        contractInstance = await CryptoZombies.new();
        kittyInstance = await Kitty.new();
    });
    it("should be able to create a new zombie", async () => {
        const result = await contractInstance.createRandomZombie(zombieNames[0], {from: alice});
        assert.equal(result.receipt.status, true);
        assert.equal(result.logs[0].args.name, zombieNames[0]);
    })
    it("should not allow two zombies", async () => {
        await contractInstance.createRandomZombie(zombieNames[0], {from: alice});
        await utils.shouldThrow(contractInstance.createRandomZombie(zombieNames[1], {from: alice}));
    })
    context("with the single-step transfer scenario", async () => {
        it("should transfer a zombie", async () => {
            const result = await contractInstance.createRandomZombie(zombieNames[0], {from: alice});
            const zombieId = result.logs[0].args.zombieId.toNumber();
            await contractInstance.transferFrom(alice, bob, zombieId, {from: alice});
            const newOwner = await contractInstance.ownerOf(zombieId);
            assert.equal(newOwner, bob);
        })
    })
    context("with the two-step transfer scenario", async () => {
        it("should approve and then transfer a zombie when the approved address calls transferForm", async () => {
            const result = await contractInstance.createRandomZombie(zombieNames[0], {from: alice});
            const zombieId = result.logs[0].args.zombieId.toNumber();
            await contractInstance.approve(bob, zombieId, {from: alice});
            await contractInstance.transferFrom(alice, bob, zombieId, {from: bob});
            const newOwner = await contractInstance.ownerOf(zombieId);
            assert.equal(newOwner, bob);
        })
        it("should approve and then transfer a zombie when the owner calls transferForm", async () => {
            const result = await contractInstance.createRandomZombie(zombieNames[0], {from: alice});
            const zombieId = result.logs[0].args.zombieId.toNumber();
            await contractInstance.approve(bob, zombieId, {from: alice});
            await contractInstance.transferFrom(alice, bob, zombieId, {from: alice});
            const newOwner = await contractInstance.ownerOf(zombieId);
            assert.equal(newOwner, bob);
         })
    })
    it("zombies should be able to attack another zombie", async () => {
        let result;
        result = await contractInstance.createRandomZombie(zombieNames[0], {from: alice});
        const firstZombieId = result.logs[0].args.zombieId.toNumber();
        result = await contractInstance.createRandomZombie(zombieNames[1], {from: bob});
        const secondZombieId = result.logs[0].args.zombieId.toNumber();
        await time.increase(time.duration.days(1));
        await contractInstance.attack(firstZombieId, secondZombieId, {from: alice});
        assert.equal(result.receipt.status, true);
    })

    it("should allow zombies to feed on kitties", async () => {
        const result = await contractInstance.createRandomZombie(zombieNames[0], {from: alice});
        const zombieId = result.logs[0].args.zombieId.toNumber();
        await contractInstance.feedOnKitty(zombieId, {from: alice});
        const kittyOwner = await contractInstance.ownerOf(zombieId);
        // Asserting that the zombie now owns the kitty after feeding
        assert.equal(kittyOwner, alice);
    })

    it("should allow zombies to battle kitties", async () => {
    // Create a zombie and a kitty
     const resultZombie = await contractInstance.createRandomZombie(zombieNames[0], { from: alice });
     const zombieId = resultZombie.logs[0].args.zombieId.toNumber();
    
     const resultKitty = await kittyInstance.createRandomKitty({ from: bob });
     const kittyId = resultKitty.logs[0].args.kittyId.toNumber();
    
     // Perform battle between the zombie and kitty
     await contractInstance.battle(zombieId, kittyId, { from: alice });
    
     // Check the outcome of the battle
     const zombieOwner = await contractInstance.ownerOf(zombieId);
     const kittyOwner = await kittyInstance.ownerOf(kittyId);
    
     // Assert that the winner of the battle is the owner of the zombie
     assert.equal(zombieOwner, alice);
     // Assert that the loser of the battle is the owner of the kitty
     assert.equal(kittyOwner, bob);
    });

})
