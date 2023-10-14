import { Identity, HttpAgent } from "@dfinity/agent";
import { useAuth } from "../auth/auth";
import { useEffect } from "react";
import { createTokenActor } from "../token/index"

interface loginResponse {
    cbindex: number,
    result: boolean,
    principal: string,
    accountId: string,
    error?: string
}

interface tokenResponse {
    cbIndex: number,
    result: boolean,
    fundCount: number
}

// Extend this file with new unity functions
export default function AddUnityFunctions(unityContext) {
	
    const auth = useAuth();

    // alternative pattern
	/*
    unityContext.on("ICLogin", async function (cbIndex) {
		await CanisterUtils.ICLogin(cbIndex, unityContext, auth);
	});
	
	unityContext.on("GetCoin", async function (cbIndex) {
		await CanisterUtils.GetCoin(cbIndex, unityContext, auth);
	});
    */
    
	async function handleLogin(cbIndex){
		await IILogin(cbIndex, unityContext, auth);
	};

	async function handleLogout(cbIndex){
        await IILogout(cbIndex, unityContext, auth);
    }

    async function handleGetToken(cbIndex){
        await GetToken(cbIndex, unityContext, auth);
    }
	
	useEffect(() => {
		unityContext.on("ICLogin", handleLogin);
		return () => {
			removeEventListener("ICLogin", handleLogin);
		};
	}, [addEventListener, removeEventListener, handleLogin]);

	useEffect(() => {
		unityContext.on("ICLogout", handleLogout);
		return () => {
			removeEventListener("ICLogout", handleLogout);
		};
	}, [addEventListener, removeEventListener, handleLogout]);

    useEffect(() => {
		unityContext.on("GetToken", handleGetToken);
		return () => {
			removeEventListener("GetToken", handleGetToken);
		};
	}, [addEventListener, removeEventListener, handleGetToken]);

}
    
async function IILogin(cbIndex, unityContext, auth) { 
    try {
        const identity: Identity = await auth?.logIn();
		const principal = identity.getPrincipal()
		const agent = new HttpAgent({ identity });
		const result = auth?.isAuthReady;

		let data: loginResponse = {
            cbindex: cbIndex,
            result: result,
            principal: principal.toText(),
            accountId: ""
        }
		
        unityContext.send("CanisterConnection", "HandleCallback", JSON.stringify(data));

    } catch (e) {
        console.error(e);
        unityContext.send("CanisterConnection", "HandleCallback", JSON.stringify(e.message));
    }
}


async function IILogout(cbIndex, unityContext, auth) { 
	const identity = await auth?.logOut();
	let data: loginResponse = {
		cbindex: cbIndex,
		result: true,
		principal: "",
		accountId: ""
	}
	unityContext.send("CanisterConnection", "HandleCallback", JSON.stringify(data));
}



async function GetToken(cbIndex, sendMessage, auth) {
    
	try{
		const agent = new HttpAgent(auth.identity);
		const tokenActor = createTokenActor(agent);
		const response = await tokenActor.requestCoin();

        let data: tokenResponse = {
            cbIndex: cbIndex,
            result: (response == response['ok']),
            fundCount: Number(response['ok'])
        }

		if (response['ok']){
			const fundNum = Number(response['ok']);
			console.log("Fund Request successful:", fundNum);
		}
		else if (response['err']){
			const responseErr = response['err'];
		}
		sendMessage("CanisterConnection", "HandleCallback", JSON.stringify(data));

	} catch (e) {
		console.error(e);
		sendMessage("CanisterConnection", "HandleCallback", JSON.stringify(e.message));
    }
};