console.log("java")
let songs;
let currFolder;
let currentSong = new Audio()
function secondsToMinutesSecond(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";

    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0')
    const formattedSeconds = String(remainingSeconds).padStart(2, '0')

    return `${formattedMinutes}:${formattedSeconds}`
}

async function getSongs(folder) {

    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response
    let as = div.getElementsByTagName("a")

    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }
    let songUL = document.querySelector(".songList ul")
    songUL.innerHTML = ""
    for (const song of songs) {
        // Cleaned name for display
        let displayName = song
            .replaceAll("%20", " ")
            .replace(/[_-]+/g, " ")
            .replace(/128kbps/gi, "")
            .replace(/\.mp3$/i, "")
            .trim()

        // Store original file in a data attribute
        songUL.innerHTML += `
        <li data-file="${song}">
            <img class="invert" src="music.svg" alt="">
            <div class="info">
                <div>${displayName}</div>
                <div>aman rawat</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="">
            </div>
        </li>`
    }

    // Attach event listener
    Array.from(document.querySelectorAll(".songList li")).forEach(li => {
        li.addEventListener("click", () => {
            let fileName = li.dataset.file; // ✅ actual file
            let songName = li.querySelector(".info div:first-child").innerText; // pretty display
            console.log("Playing:", songName, "| File:", fileName)
            playMusic(fileName)
        })

    })

}

const playMusic = (track, pause = false) => {
    currentSong.src = `/songs/${currFolder}/` + track

    if (!pause) {
        currentSong.play()
        play.src = "img/pause.svg"

    }
    let displayName = track
        .replaceAll("%20", " ")
        .replace(/[_-]+/g, " ")
        .replace(/128kbps/gi, "")
        .replace(/\.mp3$/i, "")
        .trim()
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
}

async function displayAlbums() {
    console.log("display albums");
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    //  First add fixed playlists: NCS and CS
    let fixedPlaylists = ["ncs", "cs"];
    for (let folderName of fixedPlaylists) {
        try {
            let res = await fetch(`http://127.0.0.1:5500/songs/${folderName}/info.json`);
            if (!res.ok) throw new Error(`No info.json in ${folderName}`);
            let json = await res.json();

            let card = document.createElement("div");
            card.classList.add("card");
            card.dataset.folder = folderName;
            card.innerHTML = `
                
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folderName}/cover.jpg" alt="">
                    <h2>${json.title}</h2>
                    <p>${json.description}</p>
                `;

            card.addEventListener("click", async () => {
                console.log("Clicked:", folderName);
                await getSongs(folderName);
                playMusic(songs[0]);
            });

            cardContainer.appendChild(card);
        } catch (err) {
            console.error("error loading fixed playlist", err);
        }
    }

    //  Now loop through other folders, but skip "ncs" and "cs"
    Array.from(anchors).forEach(async e => {
        if (e.href.includes("/songs")) {
            let url = new URL(e.href);
            let parts = url.pathname.split("/").filter(Boolean);

            if (parts.length === 2) {
                let folderName = parts[1];

                if (["ncs", "cs"].includes(folderName)) return; // skip fixed ones

                try {
                    let res = await fetch(`http://127.0.0.1:5500/songs/${folderName}/info.json`);
                    if (!res.ok) throw new Error(`No info.json in ${folderName}`);
                    let json = await res.json();

                    let card = document.createElement("div");
                    card.classList.add("card");
                    card.dataset.folder = folderName;
                    card.innerHTML = `
                        
                            <div class="play">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                        stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="/songs/${folderName}/cover.jpg" alt="">
                            <h2>${json.title}</h2>
                            <p>${json.description}</p>
                        </div>`;

                    card.addEventListener("click", async () => {
                        console.log("Clicked:", folderName);
                        await getSongs(folderName);
                        playMusic(songs[0]);
                    });

                    cardContainer.appendChild(card);
                } catch (err) {
                    console.error("error loading info.json", err);
                }
            }
        }
    });
}


async function main() {

    await getSongs("ncs")
    playMusic(songs[0], true)
    //display all the albums on the page
    displayAlbums()

    // attach an event listener to play previous and next
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        }

        else {
            currentSong.pause()
            play.src = "img/play.svg"
        }
    })
    //listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSecond(currentSong.currentTime)}/${secondsToMinutesSecond(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
    })
    //add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%"
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    }
    )
    //add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })
    //add an event listener for close 
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })
    // add an event listener for previous 
    previous.addEventListener("click", () => {
        console.log("Previous clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])

        }

    })
    // add an event listener for next
    next.addEventListener("click", () => {
        console.log("Next clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])

        }
    })
    // add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("setting volume to ", e.target.value)
        currentSong.volume = parseInt(e.target.value) / 100
    })

    // Attach click events to hard-coded cards
    Array.from(document.querySelectorAll(".card")).forEach(card => {
        card.addEventListener("click", async () => {
            let folderName = card.dataset.folder;  // "ncs" or "cs"
            console.log("Clicked hardcoded card:", folderName);
            await getSongs(folderName);
            playMusic(songs[0]);
        });
    });

    // add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click",e=>{
        console.log(e.targe)
        console.log("changing", e.target.src)
        document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        if(e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg","mute.svg")
            currentSong.volume = 0;

        }
        else{
           e.target.src = e.target.src.replace("mute.svg","volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    } )

}

main()


