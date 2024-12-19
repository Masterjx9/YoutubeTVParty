import { handleDataChannelOpen } from "./Status.js";

function startHostParty(){
  console.lo
    chrome.runtime.sendMessage({ type: 'initPeerABackground' });
     
     const statusDiv = document.getElementById('youtubeTVStatus');
     statusDiv.innerHTML = `<p>Copy this code and send it to your friend:</p>
       <input id="offerCodeInput" type="text" readonly value="Waiting for offer...">`;
   
     // Periodically update the input value with the generated offer
   
     // Update the offer when it's generated
     const originalLog = console.log;
     console.log = function(message, value) {
       originalLog.apply(this, arguments);
       if (message.includes('Local Offer')) {
         console.log('Offer:', value);
         const offerCode = btoa(value); // Base64 encode
         console.log('Offer Code:', offerCode);
         document.getElementById("offerCodeInput").value = offerCode;
       }
     };
   
     // Add input field for accepting the answer
     const answerInputHtml = `
       <p>Enter the answer code from your friend:</p>
       <input id="answerCodeInput" type="text" placeholder="Paste answer code here">
       <button id="submitHostOfferButton">Submit Answer</button>
     `;
     statusDiv.innerHTML += answerInputHtml;
   
     document.getElementById('submitHostOfferButton').addEventListener('click', () => {
       const answerCode = document.getElementById('answerCodeInput').value;
       if (answerCode) {
        let decodedAnswer;
        try {
        decodedAnswer = atob(answerCode);
        } catch (error) {
          console.error('Failed to decode answer:', error);

          alert('Failed to decode answer. Click Host Party again to try again.');
        }
         chrome.runtime.sendMessage({ type: 'acceptAnswerpeerABackground', answer: decodedAnswer });
       }
     });
 }

 function joinHostParty(){
    chrome.runtime.sendMessage({ type: 'initPeerBBackground' });
    
    const statusDiv = document.getElementById('youtubeTVStatus');
    statusDiv.innerHTML = `
      <p>Enter the offer code from your host:</p>
      <input id="offerCodeInput" type="text" placeholder="Paste offer code here">
      <button id="submitOfferButton">Submit Offer</button>
    `;
  
    document.getElementById('submitOfferButton').addEventListener('click', () => {
      const offerCode = document.getElementById('offerCodeInput').value;
      if (offerCode) {
        console.log('Offer Code:', offerCode);
        const decodedOffer = atob(offerCode);
        console.log('Decoded Offer:', decodedOffer);
        chrome.runtime.sendMessage({ type: 'acceptOfferpeerBBackground', answer: decodedOffer });

      }
    });
}


document.getElementById('hostPartyButton').addEventListener('click', () => {
    startHostParty();
  });
  
  document.getElementById('joinPartyButton').addEventListener('click', () => {
    joinHostParty();    
  });
  










function appStateCheck(){
  console.log('test');
  chrome.runtime.sendMessage({ type: 'getAppState' }, (response) => {
        console.log('App State:', response);
        if (response.appState) {
          if (response.appState.currentPage === 'hostPartyWindow') {
            console.log
            startHostParty();
          } else if (response.appState.currentPage === 'joinPartyWindow') {
            joinHostParty();
          } else if (response.appState.currentPage === 'StatusWindow') {
            handleDataChannelOpen();
          } else if (response.appState.currentPage === 'ChangeVideoWindow') {
            //we may add more to this later
            handleDataChannelOpen();
          }
        }
      });

}
appStateCheck()