import React, { useEffect, useState } from "react";
import DVideo from "../abis/DVideo.json";
import Navbar from "./Navbar";
import Main from "./Main";
import Web3 from "web3";
import "./App.css";

//Declare IPFS
const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
}); // leaving out the arguments will default to these values

const App = () => {
  let data = [];
  const [buffer, setBuffer] = useState(null);
  const [account, setAccount] = useState("");
  const [dvideo, setDvideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHash, setCurrentHash] = useState(null);
  const [currentTitle, setCurrentTitle] = useState(null);

  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);

  useEffect(() => {
    uploadVideo.bind();
    captureFile.bind();
    changeVideo.bind();
  }, []);
  useEffect(() => {
    console.log("hi there");
  }, [videos]);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  const loadBlockchainData = async () => {
    const web3 = window.web3;
    // Load account
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
    // Network ID
    const networkId = await web3.eth.net.getId();
    const networkData = DVideo.networks[networkId];
    if (networkData) {
      const dvideo = new web3.eth.Contract(DVideo.abi, networkData.address);
      setDvideo(dvideo);
      const videosCount = await dvideo.methods.videoCount().call();
      console.log(videosCount);

      // // Load videos, sort by newest
      for (var i = videosCount; i >= 1; i--) {
        const video = await dvideo.methods.videos(i).call();
        console.log(videos);
        setVideos(data);
        data.push(video);
        console.log("data=", data);
      }

      // //Set latest video with title to view as default
      if (videosCount != 0) {
        const latest = await dvideo.methods.videos(videosCount).call();
        setCurrentHash(latest.hash);
        setCurrentTitle(latest.title);
      }

      setLoading(false);
    } else {
      window.alert("DVideo contract not deployed to detected network.");
    }
  };

  const captureFile = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    console.log(file);
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    console.log(reader);

    reader.onloadend = async () => {
      const buffer = await Buffer(reader.result);
      setBuffer(buffer);
      console.log("buffer=", buffer);
    };
  };

  const uploadVideo = (title) => {
    console.log("Submitting file to IPFS...");

    //adding file to the IPFS
    ipfs.add(buffer, (error, result) => {
      console.log("IPFS result", result);
      if (error) {
        console.error(error);
        return;
      }

      console.log(result);
      setLoading(true);
      dvideo.methods
        .uploadVideo(result[0].hash, title)
        .send({ from: account })
        .on("transactionHash", (hash) => {
          setLoading(false);
        });
    });
  };

  const changeVideo = (hash, title) => {
    setCurrentHash(hash);
    setCurrentTitle(title);
  };

  return (
    <div>
      <Navbar account={account} />
      {loading ? (
        <div id="loader" className="text-center mt-5">
          <p>Loading...</p>
        </div>
      ) : (
        <Main
          videos={videos}
          uploadVideo={uploadVideo}
          captureFile={captureFile}
          changeVideo={changeVideo}
          currentHash={currentHash}
          currentTitle={currentTitle}
        />
      )}
    </div>
  );
};

export default App;
