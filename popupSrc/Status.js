chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'updateChannelStatus') {
      console.trace('Received channel stats update from background.js:', message.stats);
      updateChannelStatusTemplate(
          message.stats.title, 
          message.stats.videoId, 
          message.stats.lastKnownTime
      );
      sendResponse({ status: 'Channel status updated in app.html' });
  }
  if (message.type === 'updateOfferCode') {
    const offerInput = document.getElementById("offerCodeInput");
    if (offerInput) {
        offerInput.value = message.offerCode;
        console.log('Offer code updated in popup:', message.offerCode);
    }
} if (message.type === 'wrongAnswerCode') {
    alert('Wrong answer code. Please double check with your guest and try again.');
}

if (message.type === 'updateGuestWithFinalCodeForHost') {
    updateGuestWithFinalCodeForHost(message.answerCode);
    console.log('Final code updated for host:', message.answerCode);
} if (message.type === 'kickleaveParty') {
    console.log('User has been kicked from the sync');
    kickleaveParty();
} if (message.type === 'handleDataChannelOpen') {
  await handleDataChannelOpen();
}

return true;
});

function updateChannelStatusTemplate(title, id, lastKnownTime) {
    const statusDiv = document.getElementById('youtubeTVStatus');
    let channelStatus = document.getElementById('channelStatus');
    if (!channelStatus) {
      channelStatus = document.createElement('div');
      channelStatus.id = 'channelStatus';
      channelStatus.style.border = '1px solid black';
      channelStatus.style.padding = '20px';
      channelStatus.style.marginBottom = '20px';
      statusDiv.appendChild(channelStatus);
    }
    channelStatus.innerHTML = `
      <h3>Channel Status</h3>
      <p>Current Title: ${title}</p>
      <p>Video ID: ${id}</p>
      <p>Last Known Time: ${lastKnownTime}</p>
    `;
  }
  

function updateGuestWithFinalCodeForHost(answerCode) {
    let answerCodePElement = document.getElementById('answerCodeMessage');
    let answerCodeElement = document.getElementById('answerCodeInput');
    if (!answerCodePElement) {
      answerCodePElement = document.createElement('p');
      answerCodePElement.id = 'answerCodeMessage';
      document.getElementById('youtubeTVStatus').appendChild(answerCodePElement);
    }
    if (!answerCodeElement) {
      answerCodeElement = document.createElement('input');
      answerCodeElement.id = 'answerCodeInput';
      answerCodeElement.type = 'text';
      answerCodeElement.readOnly = true;
      document.getElementById('youtubeTVStatus').appendChild(answerCodeElement);
    }
    answerCodePElement.textContent = 'This code is the confirmation code to your host';
    answerCodeElement.value = answerCode;
  }
  

function kickleaveParty(){
  console.log('User has been kicked from the sync');
  document.getElementById('hostPartyButton').disabled = false;
  document.getElementById('hostPartyButton').style.backgroundColor = '#da0404';
  document.getElementById('joinPartyButton').disabled = false;
  document.getElementById('joinPartyButton').style.backgroundColor = '#da0404';
  document.getElementById('youtubeTVStatus').innerHTML = '';
}

// take care of later:

 // Handle Data Channel Open Event
export async function handleDataChannelOpen() {
    console.trace('Data channel open event received');
  // 1. Wipe the youtubeTVStatus div
  const statusDiv = document.getElementById('youtubeTVStatus');
  statusDiv.innerHTML = ''; 
  
  // 2. Disable the host and join buttons
  document.getElementById('hostPartyButton').disabled = true;
  // grey out the button using css
  document.getElementById('hostPartyButton').style.backgroundColor = 'grey';

  document.getElementById('joinPartyButton').disabled = true;
  // grey out the button using css
  document.getElementById('joinPartyButton').style.backgroundColor = 'grey';
  console.log('test');
  chrome.runtime.sendMessage({ type: 'getAppState' }, (response) => {
    console.log('App State:', response.appState);
      if (response.appState.isHost) {
        console.log('I am the host');
          chrome.runtime.sendMessage({ type: 'syncRefreshForeground' });
      } else {
        console.log('I am the guest');
          chrome.runtime.sendMessage({ type: 'syncRefreshForegroundRequest' });
          sendMessageAsync({ type: 'incomingMessage', message: JSON.stringify({ action: 'syncRefreshRequest' }) });
        }
  });

  // 4. Add the "Kick User" or "Leave Party" button
  const actionButton = document.createElement('button');
  chrome.runtime.sendMessage({ type: 'getAppState' }, (response) => {
      if (response.appState.isHost) {
          actionButton.id = 'kickUserButton';
          actionButton.textContent = 'Kick User';
      } else {
          actionButton.id = 'leavePartyButton';
          actionButton.textContent = 'Leave Party';
      }
  });
  actionButton.style.position = 'absolute';
  actionButton.style.bottom = '20px';
  actionButton.style.right = '20px';
  actionButton.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'getAppState' }, (response) => {
    kickAndDisconnect();

  });
  });
  statusDiv.appendChild(actionButton);
}

function sendMessageAsync(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}


async function kickAndDisconnect() {
    try {
      console.log('Kicking user and disconnecting');
        await sendMessageAsync({ type: 'incomingMessage', message: JSON.stringify({ action: 'kick' }) });
        console.log('Kick message sent successfully');
        await sendMessageAsync({ type: 'DiscconectPartyForeground' });
        console.log('Disconnected successfully');
    } catch (error) {
        console.error('Error sending messages:', error);
    }
}
