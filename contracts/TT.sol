// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TT is ERC20 {
    // owner
    address private owner;
    // initial supply 1M
    uint256 private _initialSupply = 1000000 * 10**6;
    // constructor
    constructor() ERC20("Ticket Token", "TT") {
        owner = msg.sender;
        _mint(msg.sender, _initialSupply);
    }
    // only owner can call
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    // decimals
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    // burn function
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

     // function mint(address to, uint256 amount) public onlyOwner {
    //     _mint(to, amount);
    // }
}
