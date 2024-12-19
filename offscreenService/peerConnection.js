let dataChannel = null;
let peerConnection = null;
let peerA = null;
let peerB = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'initPeerA':
            peerA = startPeerA();
            break;
        case 'initPeerB':
            peerB = startPeerB();
            break;
        case 'acceptAnswerpeerA':
            peerA.acceptAnswer(message.answer);
            break;
        case 'acceptOfferpeerB':
            peerB.acceptOffer(message.answer);
            break;
        case 'syncRefresh':
            syncRefresh();
            break;
        case 'handleIncomingMessageFromPeer':
            if (message.peer === 'peerA') {
                console.log('Sending message to Peer A:', message.message);
                peerA.sendMessage(message.message);
            } else if (message.peer === 'peerB') {
                console.log('Sending message to Peer B:', message.message);
                peerB.sendMessage(message.message);
            }
            break;
        case 'DiscconectParty':
            console.log('Disconnecting party');
            DiscconectParty();
            break;

    }
});



// Create Peer Connection for Peer A (Host/Leader)
function startPeerA() {
    chrome.runtime.sendMessage({ type: 'updateAppState', state: {
        isHost: true,
        currentPage: "hostPartyWindow"
    } });
    peerConnection = new RTCPeerConnection();
    dataChannel = peerConnection.createDataChannel('chat');
  
    dataChannel.onmessage = handleIncomingMessageFromPeer;
    dataChannel.onopen = handleDataChannelOpenHelper;
  
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) return;
      const offerCode = btoa(JSON.stringify(peerConnection.localDescription)); // Base64 encode the offer
      console.log('Local Offer (Copy this and give it to the other device):', offerCode);
      chrome.runtime.sendMessage({ type: 'updateOfferCodeState', offerCode });

    };
  
    peerConnection.createOffer().then((offer) => {
      peerConnection.setLocalDescription(offer);
    });
  
    return {
      sendMessage: (message) => dataChannel.send(message),
      acceptAnswer: (answer) => acceptAnswerForPeerA(answer, peerConnection)
    };
  }
  
// Accept Remote Answer for Peer A (Host/Leader)
function acceptAnswerForPeerA(answer, peerConnection) {
try {
    const remoteDesc = new RTCSessionDescription(JSON.parse(answer)); // Parse the answer as JSON
    console.log('Remote Answer:', remoteDesc);
    peerConnection.setRemoteDescription(remoteDesc);
} catch (error) {
    console.error('Failed to parse SDP answer:', error);
    chrome.runtime.sendMessage({ type: 'wrongAnswerCodeOffScreen' });
}
}


  // Create Peer Connection for Peer B (Guest/Follower)
  function startPeerB() {
  console.log('test');
  chrome.runtime.sendMessage({ type: 'updateAppState', state: {
        isHost: false,
        currentPage: "joinPartyWindow"
    } });
    peerConnection = new RTCPeerConnection();
  
    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      dataChannel.onmessage = handleIncomingMessageFromPeer;
        dataChannel.onopen = handleDataChannelOpenHelper;
};
  
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) return;
      const answerCode = btoa(JSON.stringify(peerConnection.localDescription)); // Base64 encode the answer
      console.log('Answer (Copy this and give it to the other device):', answerCode);
    chrome.runtime.sendMessage({ type: 'updateAnswerCodeState', answerCode });
    };
  
    return {
        sendMessage: (message) => dataChannel.send(message),
      acceptOffer: (offer) => acceptOfferForPeerB(offer, peerConnection)
    };
  }
  

  
  // Accept Remote Offer for Peer B (Guest/Follower)
  function acceptOfferForPeerB(offer, peerConnection) {
    try {
      const remoteDesc = new RTCSessionDescription(JSON.parse(offer)); // Parse the offer as JSON
      console.log('Remote Offer:', remoteDesc);
      peerConnection.setRemoteDescription(remoteDesc)
        .then(() => peerConnection.createAnswer())
        .then((answer) => peerConnection.setLocalDescription(answer))
        .catch((error) => console.error('Failed to accept offer and create answer:', error));
    } catch (error) {
      console.error('Failed to parse SDP offer:', error);
    }
  }
  
console.log('test3');
  

  function handleIncomingMessageFromPeer(event) {
    console.log('Message from Peer:', event);
    try {
        const message = JSON.parse(event.data);
        if (message.action === 'syncRefreshRequest') {
            console.log('Received sync refresh request');
            syncRefresh();
        }
        else if (message.action === 'kick') {
            console.log('Kicked from the party');
            DiscconectParty();
            chrome.runtime.sendMessage({ type: 'removeDetectHostVideooffscreen' });
        } else if (message.action === 'leave') {
            console.log('User left the party');
            DiscconectParty();
        } else if (message.action === 'pause') {
            console.log('Received pause command');
            chrome.runtime.sendMessage({ type: 'controlPauseoffscreen', time: message.time });
        } else if (message.action === 'play') {
            console.log('Received play command');
            chrome.runtime.sendMessage({ type: 'controlPlayoffscreen', time: message.time });
        } else if (message.action === 'seek') {
            console.log('Received seek command:', message.time);
            chrome.runtime.sendMessage({ type: 'controlSeekoffscreen', time: message.time });
        } else if (message.action === 'videoChange') {
            console.log('Received video change command:', message.videoId);
            chrome.runtime.sendMessage({ type: 'updateAppState', state: {
                currentPage: "ChangeVideoWindow",
                videoId: message.videoId
            } })
            chrome.runtime.sendMessage({ type: 'controlVideoChangeoffscreen', videoId: message.videoId });
        }
        else if (message.stats) {
            console.log('Received stats:', message.stats);
            chrome.runtime.sendMessage({ type: 'getAppState' }, (response) => {
                if (!response.appState.isHost) {
                    chrome.runtime.sendMessage({ type: 'updateChannelStatusTemplate', stats: message.stats });
                }
            }
            )}
    } catch (error) {
        console.error('Failed to parse incoming message:', error);
    }
}
console.log('test4');


function handleDataChannelOpenHelper(event) {
    chrome.runtime.sendMessage({ type: 'updateAppState', state: {
        currentPage: "StatusWindow"
    } })
    chrome.runtime.sendMessage({ type: 'handleDataChannelOpenBackground' });
    chrome.runtime.sendMessage({ type: 'getAppState' }, (response) => {
        if (response.appState.isHost) {
            chrome.runtime.sendMessage({ type: 'detectHostVideooffscreen' });
            chrome.runtime.sendMessage({ type: 'detectVideoIdChangeoffscreen' });
        }
    });

}


async function syncRefresh() {
    console.log('Refreshing sync status');

                chrome.runtime.sendMessage({ type: 'leaderStatusoffscreen' }, (response) => {
                leaderStatusInfo = response.status;
                console.log('Leader Status Info:', leaderStatusInfo);
          
                peerA.sendMessage(JSON.stringify({
                    stats: {
                        title: leaderStatusInfo.title,
                        videoId: leaderStatusInfo.videoId,
                        lastKnownTime: leaderStatusInfo.lastKnownTime
                    }
                }));

                chrome.runtime.sendMessage({ type: 'getAppState' }, (response) => {
                    if (response.appState.isHost) {
                        chrome.runtime.sendMessage({ type: 'updateChannelStatusTemplate', stats: leaderStatusInfo });
                    }
                });

            });
   
}



function DiscconectParty() {
    console.log('sending kickleavePartyUpdate');
    chrome.runtime.sendMessage({ type: 'kickleavePartyUpdate' });
    console.log('Disconnecting from the party');
    try {
        // Close the data channel if it exists
        if (dataChannel) {
            dataChannel.close();
            console.log('Data channel closed');
        }

        // Close the peer connection if it exists
        if (peerConnection) {
            peerConnection.close();
            console.log('Peer connection closed');
        }

        // Reset variables to clear the connection state
        peerConnection = null;
        dataChannel = null;
    } catch (error) {
        console.error('Error while kicking user:', error);
    }
}

