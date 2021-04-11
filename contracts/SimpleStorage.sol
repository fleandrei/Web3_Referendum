// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract SimpleStorage {
  uint UintStoredData;
  bytes BytesStoredData;

  function set(uint x, bytes calldata y) public {
    UintStoredData = x;
    BytesStoredData = y;
  }

  function get() public view returns (uint uint_data, bytes memory bytes_data) {
    return (UintStoredData, BytesStoredData);
  }
}
