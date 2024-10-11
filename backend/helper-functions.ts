import { run } from "hardhat";

const verify = async (contractAddress: string, args: any[], contractPath?: string) => {
    console.log("Verifying contract...");
    try {
        const verificationOptions: { address: string; constructorArguments: any[]; contract?: string } = {
            address: contractAddress,
            constructorArguments: args,
        };

        // If a specific contract path is provided, include it in the verification options
        if (contractPath) {
            verificationOptions.contract = contractPath;
        }

        await run("verify:verify", verificationOptions);
        console.log("Verification successful!");
    } catch (e: any) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!");
        } else {
            console.log("Verification failed:", e);
        }
    }
};

export default verify;