
///
///
///
/// Variables

///
///
///


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'leaderStatus':
            console.log('Received leader status request');  
            leaderStatus().then((status) => {
                sendResponse({ status });
            });
            break;
        case 'detectHostVideo':
            detectHostVideo();
            break;
        case 'detectVideoIdChange':
            detectVideoIdChange();
            break;
        case 'removeDetectHostVideo':
            removeDetectHostVideo();
            break;
        case 'controlPause':
            controlPause(message);
            break;
        case 'controlPlay':
            controlPlay(message);
            break;
        case 'controlSeek':
            controlSeek(message);
            break;
        case 'controlVideoChange':
            controlVideoChange(message);
            break;

    }
});
///Functions
function controlPause(message){
    document.querySelector('video.html5-main-video').pause();
    document.querySelector('video.html5-main-video').currentTime = message.time;
}
function controlPlay(message){
    document.querySelector('video.html5-main-video').currentTime = message.time;
    document.querySelector('video.html5-main-video').play();
}

function controlSeek(message){
    document.querySelector('video.html5-main-video').currentTime = message.time;
}

function controlVideoChange(message){
    window.location.href = `https://tv.youtube.com/watch/${message.videoId}`;
}

async function leaderStatus() {
    try {
        const title = document.getElementById('id-player-main')?.ariaLabel || 'No Title Found';
        const videoId = JSON.parse(document.getElementById('id-ytu-app')?.getAttribute('has-watch-endpoint') || '{}')?.watchEndpoint?.videoId || 'No Video Id';
        const lastKnownTime = document.querySelector('ytu-time-bar[slot="time-bar"][current-time-only]')?.querySelector('.current-time')?.innerHTML || 'No Time Found';
        
        const result = { title, videoId, lastKnownTime };
        
        console.log("YouTube TV Title:", result);
        return result;
    } catch (error) {
        console.error('Error retrieving YouTube TV status:', error);
        return { title: 'Error', videoId: 'Error', lastKnownTime: 'Error' };
    }
}

function leaderControl() {
    // goal: Send commands to leader to control youtubeTV
}



  
  // Utility: Escape JSON Strings (for Peer A only)
  function escapeJsonString(input) {
    return input.replace(/\\/g, '\\\\').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
  }
  
  // Utility: Clean Control Characters in Answer (for Peer A only)
  function cleanControlCharacters(answer) {
    return answer.replace(/[\u0000-\u001F\u007F-\u009F]/g, (char) => {
      return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
    });
  }





// DOM Detectors for Host

function detectHostVideo(){
    const videoElement = document.querySelector('video.html5-main-video');
if (videoElement) {
    videoElement.addEventListener('pause', () => {
        console.log('The video has been paused.');
        let currentTime = videoElement.currentTime;
        chrome.runtime.sendMessage({ type: 'handleIncomingMessageFromPeer', peer: 'peerA', message: JSON.stringify({ action: 'pause', time: currentTime })});
    });
    videoElement.addEventListener('play', () => {
        console.log('The video has been played.');
        let currentTime = videoElement.currentTime;
        chrome.runtime.sendMessage({ type: 'handleIncomingMessageFromPeer', peer: 'peerA', message: JSON.stringify({ action: 'play', time: currentTime })});
    });
    videoElement.addEventListener('seeked', () => {
        console.log('The video has been seeked.');
        let currentTime = videoElement.currentTime;
            chrome.runtime.sendMessage({ type: 'handleIncomingMessageFromPeer', peer: 'peerA', message: JSON.stringify({ action: 'seek', time: currentTime })});
    });
    const targetNode = document.getElementById('id-ytu-app');
    let lastVideoId = JSON.parse(targetNode?.getAttribute('has-watch-endpoint') || '{}')?.watchEndpoint?.videoId || null;
    if (targetNode) {
        const observer = new MutationObserver(() => {
            try {
                const videoId = JSON.parse(targetNode.getAttribute('has-watch-endpoint') || '{}')?.watchEndpoint?.videoId;
                if (videoId && videoId !== lastVideoId) {
                    console.log('Video ID changed to:', videoId);
                    lastVideoId = videoId;
                    chrome.runtime.sendMessage({ type: 'handleIncomingMessageFromPeer', peer: 'peerA', message: JSON.stringify({ action: 'videoChange', videoId })});
                }
            } catch (error) {
                console.error('Error parsing video ID:', error);
            }
        });

        observer.observe(targetNode, { attributes: true, childList: false, subtree: false });
    }

}
}
function removeDetectHostVideo() {
    const videoElement = document.querySelector('video.html5-main-video');
    if (videoElement) {
        videoElement.removeEventListener('pause', () => {
        });
        videoElement.removeEventListener('play', () => {
        });
        videoElement.removeEventListener('seeked', () => {
        });
    }
}

function detectVideoIdChange() {
    let lastVideoId = null;

    const checkVideoId = () => {
        const videoId = JSON.parse(document.getElementById('id-ytu-app')?.getAttribute('has-watch-endpoint') || '{}')?.watchEndpoint?.videoId;
        if (videoId && videoId !== lastVideoId) {
            console.log('Video ID changed to:', videoId);
            lastVideoId = videoId;

            chrome.runtime.sendMessage({ type: 'handleIncomingMessageFromPeer', peer: 'peerA', message: JSON.stringify({ action: 'videoChange', videoId })});
        }
    };

    checkVideoId();

    const targetNode = document.getElementById('id-ytu-app');
    if (targetNode) {
        const observer = new MutationObserver(() => {
            checkVideoId();
        });

        observer.observe(targetNode, { attributes: true, childList: false, subtree: false });
    }
}
