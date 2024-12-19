// background.js

chrome.runtime.onInstalled.addListener(() => {
    ensureOffscreenDocument();
  });
  
  async function ensureOffscreenDocument() {
    const offscreenUrl = chrome.runtime.getURL("/offscreenService/peerConnection.html");
    const docs = await chrome.offscreen.hasDocument();
    if (!docs) {
        await chrome.offscreen.createDocument({
            url: offscreenUrl,
            reasons: ['WEB_RTC'],
            justification: 'Need to keep WebRTC connection alive.'
          });
          
    }
  }
// background.js
// let appState = {};
function updateAppState(newState) {
    chrome.storage.local.get(['appState'], (result) => {
        const currentState = result.appState || {};
        const updatedState = { ...currentState, ...newState };
        chrome.storage.local.set({ appState: updatedState }, () => {
            console.trace('App State Updated:', updatedState);
        });
    });
}

function getAppState(callback) {
    chrome.storage.local.get(['appState'], (result) => {
        callback(result.appState || {});
    });
}


// Handle runtime messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'initPeerABackground':
            chrome.runtime.sendMessage({ type: 'initPeerA' });
            break;
        case 'acceptAnswerpeerABackground':
            chrome.runtime.sendMessage({ type: 'acceptAnswerpeerA', answer: message.answer });
            break;
        case 'initPeerBBackground':
            chrome.runtime.sendMessage({ type: 'initPeerB' });
            break;
        case 'acceptOfferpeerBBackground':
            chrome.runtime.sendMessage({ type: 'acceptOfferpeerB', answer: message.answer });
            break;
        case 'DiscconectPartyForeground':
            console.log('Disconnecting party');
    
            chrome.runtime.sendMessage({ type: 'DiscconectParty' });
        
            return true; 
            
        case 'syncRefreshForeground':
            console.log(message);
            chrome.runtime.sendMessage({ type: 'syncRefresh' });
            console.log('Sync Refreshed test');
                break;
        case 'wrongAnswerCodeOffScreen':
            console.log('Wrong Answer Code');
            sendMessageToApp({ type: 'wrongAnswerCode' });
            break;
        case 'updateChannelStatusTemplate':
            // appState['channelStats'] = message.stats;
            console.log('Channel Stats:', message.stats);
            console.log('updateChannelStatusTemplate');
            updateAppState({ channelStats: message.stats });
            sendMessageToApp({ 
                type: 'updateChannelStatus', 
                stats: message.stats 
            });
            
            sendResponse({ status: 'Channel status updated' });
            break;
        case 'updateOfferCodeState':
            // appState['offerCode'] = message.offerCode;
            updateAppState({ offerCode: message.offerCode });
            sendMessageToApp({ 
                type: 'updateOfferCode',
                offerCode: message.offerCode
            });

            sendResponse({ status: 'Offer code updated' });
            break;
        case 'updateAnswerCodeState':
            // appState['answerCode'] = message.answerCode;
            updateAppState({ answerCode: message.answerCode });
            console.log('Answer Code in browser.js:', message);
            sendMessageToApp({ 
                type: 'updateGuestWithFinalCodeForHost',
                answerCode: message.answerCode
            });

            sendResponse({ status: 'Answer code updated' });
            break;
        case 'handleDataChannelOpenBackground':
            sendMessageToApp({ type: 'handleDataChannelOpen' });
            break;
        case 'incomingMessage':
            console.log('Incoming message:', message.message);
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    getAppState((appState) => {
                        const peer = appState.isHost ? 'peerA' : 'peerB';
                        console.log('Sending message from peer:', peer);
                        chrome.runtime.sendMessage({ type: 'handleIncomingMessageFromPeer', message: message.message, peer });
                        sendResponse({ status: 'Message handled' }); 
                    });
                } else {
                    sendResponse({ status: 'No active tabs found' });
                }
            });
                return true; 
        case 'kickleavePartyUpdate':
            console.log('Kicking user from the sync');
            // appState = {};
            chrome.storage.local.set({ appState: {} }, () => {
                console.log('App State Wiped');
            });   
            sendMessageToApp({ type: 'kickleaveParty' });
            break;
        case 'getAppState':
            getAppState((appState) => {
                console.log('Sending App State:', appState);
                sendResponse({ appState });
            });
            return true;
        case 'updateAppState':
            updateAppState(message.state);
            getAppState((appState) => {
                console.log('App State:', appState);
            });
            
            sendResponse({ status: 'AppState updated' });
            break;
        case 'removeDetectHostVideooffscreen':
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'removeDetectHostVideo' });
                }});
            break;
        case 'controlPauseoffscreen':
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'controlPause', time: message.time });
                }});
            break;
        case 'controlPlayoffscreen':
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'controlPlay', time: message.time });
                }});
            break;
        case 'controlSeekoffscreen':
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'controlSeek', time: message.time });
                }});
            break;
        case 'controlVideoChangeoffscreen':
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'controlVideoChange', videoId: message.videoId });
                }});
            break;
        case 'detectHostVideooffscreen':
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'detectHostVideo' });
                }});
            break;
        case 'detectVideoIdChangeoffscreen':
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'detectVideoIdChange' });
                }});
            break;
        case 'leaderStatusoffscreen':
            console.log('Received leader status request');
            chrome.tabs.query({ url: '*://tv.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'leaderStatus' }, (response) => {
                        console.log('response:', response); 
                        sendResponse({ status: response.status });
                    });
                } else {
                    console.error('No tv.youtube.com tab found.');
                    sendResponse({ status: 'No tab found' });
                }
            });
            return true;
        
        default:
            console.log('Unknown message type:', message.type);
    }
});



function sendMessageToApp(message) {
    console.log('Sending message to app.html:', message);
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            console.log('App.html is not open', chrome.runtime.lastError.message);
        } else {
            console.log('Message sent to app.html:', message);
        }
    });
}