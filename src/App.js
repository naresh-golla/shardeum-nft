import React,{useEffect,useState} from 'react';
import { ethers } from "ethers";
import Modal, {closeStyle} from 'simple-react-modal'

import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { Input } from './components/Input';
import contractAbi from "./utils/contractAbi.json"

import polygonLogo from './assets/polygonlogo.png';
import shardeumLogo from './assets/Layer_3.svg';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';
import Confetti from "./components/Confetti"
import ModalComponent from "./components/ModalComponent"

// Constants
const CONTRACT_ADDRESS = "0x61625d89FCb24C9935caeA3415FE98da02430ED8"
const tld = '.shm';

const App = () => {

  const [mints, setMints] = useState([]);
  const [isModal, setIsModal] = useState(false); 
  const [modalData, setModalData] = useState({
    domainMinted: "",
    tokenId: ""
  }); 
  const [confetti, setConfetti] = useState(false);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState('');
  const [editing, setEditing] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');
  const [inputF, setInputF] = useState({
    domain:"",
    record:""
  })
  const [price, setPrice] = useState("0");

  const handler = (e) =>{
    const {value,name} = e.target;
    if(name === "domain"){
      if(value.length < 3){
        setPrice("0")
      }else if(value.length === 3){
        setPrice("90")
      }else if(value.length === 4){
        setPrice("50")
      }else if(value.length === 5){
        setPrice("30")
      }else if(value.length > 5){
        setPrice("10")
      }
    }
    setInputF((prevState)=>({
      ...prevState,
      [name]:value
    }))
  }

  const connectWallet = async ()=>{
        setLoading(true)
    try {
      const {ethereum} = window;
      if(!ethereum){
        alert("get metamask , -> https://metamask.io/")
      }else{
        const accounts = await ethereum.request({
          method: "eth_requestAccounts"
        })
        if(accounts.length !== 0){
          console.log("accounts[0]",accounts[0]);
          setCurrentAccount(accounts[0])
        }else{
          console.log("not authorisation to sign in")
        }
      }
    } catch (error) {
      console.log("connect error", error)
      setLoading(false)
    }
    setLoading(false)
  }

  const isWalletConnected = async ()=>{
    const {ethereum} = window;
    if(!ethereum){
      alert("Get MetaMask -> https://metamask.io/");
      return
    }else{
      console.log("we have ethereum object", ethereum)
    }

    const accounts = await ethereum.request({
      method:"eth_accounts"
    })
    if(accounts.length !==0){
      const account = accounts[0];
      console.log("found authorised account", account);
      setCurrentAccount(account);
    }else{
      console.log("No authorised account found")
    }

    const chainId = await ethereum.request({
      method:"eth_chainId"
    })
    console.log("chainId",networks[chainId])
    setNetwork(networks[chainId])

    ethereum.on("chainChanged", handleChainChanged);
    function handleChainChanged(_chainId){
      window.location.reload()
    }
  }

  const notConnectedBlock = ()=>(
    <div className="connect-wallet-container">
      {/* <img height="300" src="https://miro.medium.com/max/1000/1*r9qPeukYyZSvr6Tsn6qvcQ.gif" /> */}
      <img height="300" src={shardeumLogo} />
      <button className="cta-button connect-wallet-button" onClick={connectWallet}>
        Connect Wallet
      </button>
    </div>
  )

  const renderInputForm = ()=>{
    if(network !== "Shardeum Liberty 1.0"){
        return (
            <div className="connect-wallet-container">
              <h2>Please switch to Shardeum Liberty 1.0</h2>
              {/* This button will call our switch network function */}
              <button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
            </div>
        );
    }
    return(
      <div className="form-container">
          <div className="first-row">
              <Input value={inputF.domain} name="domain" placeholder="domain" action={handler} />
              <p className='tld'> {tld} </p>
              </div>
              <Input value={inputF.record} name="record" placeholder="record" action={handler} />
              {price > 0 && <span class="price-span">price : ${price} SHM </span>}

              {editing ? (
                <div className="button-container">
                    <button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
                      Update Record
                    </button>  
                    <button className='cta-button mint-button' disabled={null} onClick={cancelEdit}>
                      Cancel
                    </button> 
                </div>
              ) : (
                    <button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
                      Mint
                    </button> 
              )
              
              }

      </div>      
    )
  }

  useEffect(()=>{
    isWalletConnected()
  },[])

  useEffect(()=>{
  },[inputF])

  useEffect(() => {
    if (network === 'Shardeum Liberty 1.0') {
      fetchMints();
      console.log("network",network)
    }
  }, [currentAccount, network]);
  
  const mintDomain = async () => {
    let {domain, record} = inputF;

    if(!domain || domain.trim() == ''){
      alert("type a domain name to mint")
      return
    }
    if(domain.length < 3){
      alert("domain name must be atleast 3 charecters long");
      return
    }
    const price = domain.length === 3 ? "90" : domain.length === 4 ? "50" : domain.length === 5 ? "30" : "10";
    console.log("Minting Domain ", inputF.domain, "with price", price);

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
      console.log("Going to pop wallet now to pay gas...")
      console.log("value",ethers.utils.parseEther(price))
      let tx = await contract.registers(domain,{value:ethers.utils.parseEther(price)})
      console.log("SHM->tx",tx)
      const recipt = await tx.wait();
      console.log("SHM->recipt",recipt)
      if(recipt.status === 1){
        console.log("recipt",recipt)
        console.log("Domain minted! https://explorer.liberty10.shardeum.org/transaction/"+tx.hash);
        tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set! https://explorer.liberty10.shardeum.org/transaction/"+tx.hash);
        // const reciptArgs = recipt.events && recipt.events[1].args &&  recipt.events[1].args[2];
        const reciptArgs = recipt.events && recipt.events[0].args &&  recipt.events[0].args[2];
        const tokenId = parseInt(reciptArgs._hex);
        setLoading(false);
        setIsModal(!isModal);
        setModalData({
          domainMinted: domain,
          tokenId: tokenId
        });
        setConfetti(!confetti);

        setTimeout(() => {
          fetchMints();
        }, 2000);

        setInputF({
          domain:"",
          record:""
        })
        setPrice("0")

        setTimeout(() => {
        setConfetti(false)
        }, 2500);

      }else{
        alert("SHM->Transaction failed! Please try again");
        setLoading(false);
      }
      
    } catch (error) {
      setLoading(false);
      console.log("error while minting, please try again", error)
    }
  }

  const switchNetwork = async () => {
    setLoading(true)
    if (window.ethereum) {
        try {
          // Try to switch to the Mumbai testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1f90' }], // Check networks.js for hexadecimal network ids
          });
        } catch (error) {
          // This error code means that the chain we want has not been added to MetaMask
          // In this case we ask the user to add it to their MetaMask
          if (error.code === 4902) {
            try {
              let res = await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {	
                    chainId: '0x1f90',
                    chainName: 'Shardeum Liberty 1.0',
                    rpcUrls: ['https://liberty10.shardeum.org/'],
                    nativeCurrency: {
                        name: "Shardeum",
                        symbol: "SHM",
                        decimals: 18
                    },
                    blockExplorerUrls: ["https://explorer.liberty10.shardeum.org/"]
                  },
                ],
              });
              setTimeout(function () {
                location.reload()
              }, 100);
              console.log("rresss",res);
                  setLoading(false)
            } catch (error) {
              console.log(error);
                  setLoading(false)
            }
          }
          console.log(error);
        }
      } else {
        // If window.ethereum is not found then MetaMask is not installed
        alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
        setLoading(false)
      } 
  }
  
  const updateDomain = async () => {
    const {record, domain} = inputF
    if (!record || !domain) { return }
    setLoading(true);
    console.log("updating domain",domain,"with record", record);
    try {
      const {ethereum} = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

        let tx = await contract.setRecord(domain,record)
        await tx.wait();
        console.log("record set https://explorer.liberty10.shardeum.org/transaction/"+tx.hash)

        fetchMints();
        setInputF({
          domain:"",
          record:""
        })

      }
    } catch (error) {
      console.log("update domain error", error)
    }
    setLoading(false);
  }

  const fetchMints = async () => {
        setLoading(true)
    try {
      console.log("fetch MINTS---------")
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
        console.log("contract")
        // Get all the domain names from our contract
        const names = await contract.getAllNames();
        let reNames = names.filter(entry => entry.trim() != '');
        // let slicedNames = reNames.slice(0,5)
        const mintRecords = await Promise.all(reNames.map(async (name)=>{
          // For each name, get the record and the address
          // const mintRecord = await contract.getRecord(name); 
          // const ownerAddr = await contract.getAddress(name); 
          return{
            id: names.indexOf(name),
            name: name,
            record: "",
            ownerAddr: ""
            // record: mintRecord,
            // ownerAddr: ownerAddr
          }
        })); 
		setMints(mintRecords);
    setLoading(false)
      }
    } catch (error) {
      console.log("fetch mints error", error);
          setLoading(false)
    }
        setLoading(false)
  }

const renderMints = () => {
	if (currentAccount && mints.length > 0) {
  let isAddrHasNft = mints.filter((_mint, index) => _mint.ownerAddr.toLowerCase() === currentAccount.toLowerCase());
  console.log("isAddrHasNft",isAddrHasNft)
    return(
      <div className="mint-container">     
      {/* {isAddrHasNft && <p className="subtitle">Your Recently minted domains! ✨</p>} */}
      <div className="mint-list">  
      {
        mints.filter((_mint, index) => _mint.ownerAddr.toLowerCase() === currentAccount.toLowerCase()).map((mint, index) =>{
          return (
                <div className="mint-item" key={index}>
                  {/**Minted Doimains are rendered in NFT format */}
                    <div className='mint-row' data-title={mint.record}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#a)" d="M0 0h270v270H0z"/><defs><filter id="b" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs>
                        <svg x="15" y="15" width="120" height="108" viewBox="0 0 120 108" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M29.4358 77.2888L16.7213 100H103.279L90.5643 77.2888H29.4358Z" fill="white"/>
                        <path d="M60 22.7112L47.2856 0L4 77.2889H29.4358L60 22.7112Z" fill="white"/>
                        <path d="M90.5642 77.2889H116L72.7145 -3.05176e-05L60 22.7111L90.5642 77.2889Z" fill="white"/>
                        <path d="M60 73.3853C67.6037 73.3853 73.7677 67.0303 73.7677 59.1909C73.7677 51.3515 67.6037 44.9964 60 44.9964C52.3964 44.9964 46.2324 51.3515 46.2324 59.1909C46.2324 67.0303 52.3964 73.3853 60 73.3853Z" fill="white"/>
                        </svg>
                        <defs>
                            <linearGradient id="a" x1="0" y1="0" x2="270" y2="270" 
                              gradientUnits="userSpaceOnUse">
                              <stop stop-color="#cb5eee"/>
                              <stop offset="1" stop-color="#0cd7e4" stop-opacity=".99"/>
                            </linearGradient>
                        </defs>
                        <text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#b)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">
                          {mint.name}{tld}
                        </text>
                      </svg>
                    </div>
                    
                    {/* <p> {mint.record} </p> */}
                </div>
          )
        })
      }
      </div>
      

      <p className="subtitle"> All minted domains on Shardeum Name Space ✨</p>
      <div className="mint-list">  
      {
       
       [...mints].reverse().filter((_mint, index) => _mint.ownerAddr.toLowerCase() !== currentAccount.toLowerCase()).map((mint, index) =>{
          return (
              <div className="mint-item" key={index}>
                <div className='mint-row' data-title={mint.record}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#a)" d="M0 0h270v270H0z"/><defs><filter id="b" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs>
                    <svg x="15" y="15" width="120" height="108" viewBox="0 0 120 108" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M29.4358 77.2888L16.7213 100H103.279L90.5643 77.2888H29.4358Z" fill="white"/>
                    <path d="M60 22.7112L47.2856 0L4 77.2889H29.4358L60 22.7112Z" fill="white"/>
                    <path d="M90.5642 77.2889H116L72.7145 -3.05176e-05L60 22.7111L90.5642 77.2889Z" fill="white"/>
                    <path d="M60 73.3853C67.6037 73.3853 73.7677 67.0303 73.7677 59.1909C73.7677 51.3515 67.6037 44.9964 60 44.9964C52.3964 44.9964 46.2324 51.3515 46.2324 59.1909C46.2324 67.0303 52.3964 73.3853 60 73.3853Z" fill="white"/>
                    </svg>
                    <defs>
                        <linearGradient id="a" x1="0" y1="0" x2="270" y2="270" 
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#cb5eee"/>
                          <stop offset="1" stop-color="#0cd7e4" stop-opacity=".99"/>
                        </linearGradient>
                    </defs>
                    <text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#b)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">
                      {mint.name}{tld}
                    </text>
                  </svg>
                </div>
              </div>
          )
        })
      }
      </div>
      </div>
    )
    }
  }
      


const editRecord = (mint) => {
  window.scrollTo(0,250)
	console.log("Editing record for", mint);
   const domain = mint.name;
   const record = mint.record;

	setEditing(true);
      setInputF((prevState)=>({
      ...prevState,
      domain: domain,
      record: record
    }))
}

const cancelEdit = () =>{
  setEditing(false)
  setInputF({
    domain:"",
    record:""
  })
}

  const isModalFn = (isModalState) =>{
    setIsModal(isModalState)
  }

  return (
		<div className="App">
			<div className="container">
      {loading && 
      <div className="loader">
        <svg className="spinner" viewBox="0 0 50 50">
        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
        </svg>      
      </div>

      }
      <ul>
     { confetti && <Confetti />}
      </ul>

      <ModalComponent data = {modalData} isModal = {isModal} isModalFn={isModalFn}/>

				<div className="header-container">
					<header>
            <div className="left">
              <p className="title">💜 Shardeum Name Service</p>
              <p className="subtitle">Your immortal DOMAIN on the blockchain!</p>
            </div>
            {/* Display a logo and wallet connection status*/}
            <div className="right">
              <img alt="Network logo" className="logo" src={ network.includes("Shardeum") ? shardeumLogo : ethLogo} />
              { currentAccount ? <a rel="noopener noreferrer" target="_blank" href={`https://explorer.liberty10.shardeum.org/account/`+ currentAccount}> Wallet: {currentAccount.slice(0, 6)} ... {currentAccount.slice(-4) }</a> : <p> Not connected </p> }
		        </div>
					</header>
				</div>
        {!currentAccount && notConnectedBlock()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}
			</div>
		</div>
	);
}

export default App;
