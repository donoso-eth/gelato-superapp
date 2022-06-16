import { utils } from "ethers";

export const displayAdress= (address: string): string => {
    return (
      address.slice(0, 5) +
      '...' +
      address.slice(address.length - 5, address.length)
    );
  }

  export const isAddress = (address: string) => {
    try {
      utils.getAddress(address);
    } catch (e) {
      return false;
    }
    return true;
  };