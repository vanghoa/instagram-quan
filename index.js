let followers_list = [];
let thank_you_note = [
    'Hẹn họ đi cafe và trả tiền gửi xe để tỏ lòng biết ơn',
    'Gửi cho mỗi người 50 nghìn để tỏ lòng biết ơn',
    'Từ đây đến cuối tháng hãy bão tim story họ để tỏ lòng biết ơn',
];
let blocked_note = [
    'Trao giải cho bông hoa tệ nhất',
    'Cuộc sống sẽ vui hơn nếu không có một số người',
    'Quyết định đúng đắn nhất bạn từng làm',
    'Làm sao mà đến nước này?',
    'Mừng cho bạn và tất cả chúng ta',
    'Chặn những người không lành mạnh để bảo vệ không gian cá nhân của bạn',
    'Bộ an ninh quốc phòng xin thông báo',
];

async function readDirectory() {
    async function getFolder(path) {
        path = path.split('/');
        let result = dirHandle;
        for (let i = 0; i < path.length; i++) {
            result = await conditionalFileHandle(path[i]);
        }
        return result;
        function conditionalFileHandle(name) {
            return result.getDirectoryHandle(name);
        }
    }
    async function getJSON(path) {
        path = path.split('/');
        let result = dirHandle;
        for (let i = 0; i < path.length; i++) {
            result = await conditionalFileHandle(path[i], i < path.length - 1);
        }
        return JSON.parse(await readFileContents(await result.getFile()));
        function conditionalFileHandle(name, isDir) {
            return isDir
                ? result.getDirectoryHandle(name)
                : result.getFileHandle(name);
        }
    }
    async function JSONCheck(path) {
        try {
            return await getJSON(path);
        } catch (error) {
            document.querySelector(
                '#error'
            ).innerHTML += `- :/ cái file ${path} này không tồn tại - xin bạn hãy kiểm tra lại <br>- Chi tiết lỗi: ${error}<br><br>`;
            document.querySelector('#instruction').classList.remove('hidden');
            document.querySelector('#main').classList.add('hidden');
            return false;
        }
    }
    let story_likes_data = {};
    let messages_data = {};
    let liked_posts_data = {};
    let total_messages = 0;
    let total_reacts_and_stickers = 0;
    let LIMIT = 10;
    let dirHandle;
    let followers_object = {};
    followers_list = [];

    try {
        const dirHandle_ = await window.showDirectoryPicker();
        await dirHandle_.getDirectoryHandle('personal_information');
        await dirHandle_.getDirectoryHandle('story_sticker_interactions');
        await dirHandle_.getDirectoryHandle('messages');
        await dirHandle_.getDirectoryHandle('followers_and_following');
        //await dirHandle_.getDirectoryHandle('likes');
        dirHandle = dirHandle_;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return;
        }
        document.querySelector(
            '#error'
        ).innerHTML += `- :/ Bạn có chắc bạn chọn đúng folder không? Đảm bảo rằng folder bạn chọn là folder chứa mấy cái folder con bên trong ví dự như 'personal_information', 'messages', 'followers_and_following',... <br>- Chi tiết lỗi: ${error}<br><br>`;
        document.querySelector('#instruction').classList.remove('hidden');
        document.querySelector('#main').classList.add('hidden');
        return;
    }

    const personal_information = await JSONCheck(
        'personal_information/personal_information.json'
    );
    const blocked_check = await JSONCheck(
        'followers_and_following/blocked_accounts.json'
    );
    const story_likes_check = await JSONCheck(
        'story_sticker_interactions/story_likes.json'
    );

    if (
        personal_information == false ||
        blocked_check == false ||
        story_likes_check == false
    ) {
        return;
    }

    try {
        // get name
        const your_name = getUTF8String(
            personal_information.profile_user[0].string_map_data.Name.value
        );
        const your_user_name =
            personal_information.profile_user[0].string_map_data.Username.value;

        // get followers
        const follow_directory = await getFolder('followers_and_following');
        for await (const [key, value] of follow_directory) {
            if (key.startsWith('followers') && key.endsWith('.json')) {
                const data = JSON.parse(
                    await readFileContents(await value.getFile())
                );
                data.forEach(({ string_list_data }) => {
                    string_list_data.forEach(({ value }) => {
                        followers_object[value] = true;
                    });
                });
            }
        }
        followers_list = Object.keys(followers_object);

        //get blocked
        const blocked_number =
            blocked_check?.relationships_blocked_users.length ?? 0;
        document.querySelector('#blocked-note').innerText =
            blocked_number == 0
                ? 'Thật luôn?'
                : getRandomItems(blocked_note, 1);

        //get liked posts
        /*
        const liked_posts = (await getJSON('likes/liked_posts.json'))
            .likes_media_likes;
        for (const { title } of liked_posts) {
            setDefault(liked_posts_data, title, 0);
            liked_posts_data[title]++;
        }
        delete liked_posts_data[your_user_name];
        liked_posts_data = Object.entries(liked_posts_data)
            .sort((a, b) => b[1] - a[1]) // Sort in descending order based on the values
            .slice(0, LIMIT);
        */
        // get story_likes
        const story_likes =
            story_likes_check?.story_activities_story_likes ?? [];
        for (const { title } of story_likes) {
            setDefault(story_likes_data, title, 0);
            story_likes_data[title]++;
        }
        const total_story_likes_ppl = Object.keys(story_likes_data).length;
        const total_story_likes = story_likes.length;

        // get messages
        const messenger_directory = await getFolder('messages/inbox');
        for await (const [key, value] of messenger_directory) {
            if (value.kind == 'file') continue;
            for await (const [key_, value_] of value) {
                if (key_.startsWith('message') && key_.endsWith('.json')) {
                    const data = JSON.parse(
                        await readFileContents(await value_.getFile())
                    );

                    //console.log(key_, key);
                    const default_name = getUTF8String(
                        data.participants[0].name
                    );

                    const is_group_chat = data.participants.length > 2;

                    //console.log(data);
                    for (const m of data.messages) {
                        sender_name = getUTF8String(m.sender_name);
                        if (sender_name == your_name) {
                            total_messages++;
                        } else if (
                            sender_name != 'Instagram User' &&
                            sender_name != your_name &&
                            !is_group_chat
                        ) {
                            setDefault(messages_data, sender_name, {
                                call: 0,
                                messages: 0,
                                call_duration: 0,
                            });
                            messages_data[sender_name].messages++;
                        }

                        if (
                            m.hasOwnProperty('call_duration') &&
                            default_name != 'Instagram User' &&
                            !is_group_chat
                        ) {
                            setDefault(messages_data, default_name, {
                                call: 0,
                                messages: 0,
                                call_duration: 0,
                            });
                            messages_data[default_name].call_duration +=
                                m.call_duration;
                            messages_data[default_name].call++;
                        }

                        if (m.hasOwnProperty('reactions')) {
                            for (const { actor } of m.reactions) {
                                if (actor == your_name) {
                                    total_reacts_and_stickers++;
                                }
                            }
                        }
                    }
                }
            }
        }

        // sorting messages_data
        messages_data = Object.entries(messages_data)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => {
                const keyA = a.messages;
                const keyB = b.messages;

                // Sort in descending order
                return keyB - keyA;
            })
            .slice(0, LIMIT);

        // sorting story_likes_data
        story_likes_data = Object.entries(story_likes_data)
            .sort((a, b) => b[1] - a[1]) // Sort in descending order based on the values
            .slice(0, LIMIT);

        const output_data = {
            user_name: your_user_name,
            total_messages: total_messages,
            total_reacts_and_stickers: total_reacts_and_stickers,
            top_inbox: messages_data,
            top_story_likes: story_likes_data,
            total_story_likes: total_story_likes,
            total_story_likes_ppl: total_story_likes_ppl,
            liked_posts_data: liked_posts_data,
            blocked_number: blocked_number,
            followers_list: followers_list,
        };

        console.log(output_data);
        dataPopulation(output_data);
    } catch (error) {
        console.error('Error:', error);
        document.querySelector(
            '#error'
        ).innerHTML += `- Á đù! lỗi này ảo thật - xin bạn hãy report lại cho @bao.anh.bui trên instagram để sửa lỗi <br> - Chi tiết lỗi: ${error}<br><br>`;
        document.querySelector('#instruction').classList.remove('hidden');
        document.querySelector('#main').classList.add('hidden');
    }
}

async function readFileContents(file) {
    try {
        const text = await file.text();
        return text;
    } catch (error) {
        console.error('Error reading file contents:', error);
        throw error;
    }
}

function setDefault(object, prop, default_value) {
    if (!object.hasOwnProperty(prop)) {
        object[prop] = default_value;
    }
}

function getUTF8String(encodedString) {
    // Convert the encoded string to bytes
    //console.log(encodedString);
    const bytes = new Uint8Array(
        encodedString.split('').map((c) => c.charCodeAt(0))
    );

    // Decode the bytes using TextDecoder
    return (decodedString = new TextDecoder('utf-8').decode(bytes));
}

function pauseStartAnimation() {
    const pauseButtonText = document.getElementById('pause-button-text');
    const pauseButtonIcon = document.getElementById('pause-button-icon');
    if (paused) {
        pauseButtonText.innerText = 'Dừng animation';
        pauseButtonIcon.innerText = 'pause';
        paused = false;
    } else {
        pauseButtonText.innerText = 'Chạy animation';
        pauseButtonIcon.innerText = 'play_arrow';
        paused = true;
    }
}

function dataPopulation(yourData) {
    document.querySelector('#instruction').classList.add('hidden');
    document.querySelector('#main').classList.remove('hidden');
    const topPeople = document.getElementById('top-people');
    const topStoryLikes = document.getElementById('top-phrases');
    const totalMessages = document.getElementById('total-messages');
    const totalStoryLikes = document.getElementById(
        'total-reacts-and-stickers'
    );
    topPeople.innerHTML = '';
    topStoryLikes.innerHTML = '';
    totalMessages.innerHTML = '';
    totalStoryLikes.innerHTML = '';

    // populate top people
    for (let i = 0; i < yourData.top_inbox.length; i++) {
        let el = document.createElement('li');
        let details = yourData.top_inbox[i].name;
        if (i <= 2) {
            const { hours, minutes } = secondsToHoursMinutes(
                yourData.top_inbox[i].call_duration
            );
            details = `
                <details>
                <summary>${
                    yourData.top_inbox[i].name
                } <greenspan> (bấm để xem thêm)</greenspan>
                </summary>
                <p>
                    ${
                        yourData.top_inbox[i].call == 0
                            ? ''
                            : `+ ${yourData.top_inbox[i].call} lần và
                    ${
                        hours == 0 ? '' : `${hours} tiếng `
                    }${minutes} phút alo <br>`
                    }
                    + ${yourData.top_inbox[
                        i
                    ].messages.toLocaleString()} tin nhắn
                </p>
                </details>`;
        }
        el.innerHTML = details;
        topPeople.appendChild(el);
    }

    // populate top story likes
    for (let i = 0; i < yourData.top_story_likes.length; i++) {
        let el = document.createElement('li');
        el.innerHTML = `@${yourData.top_story_likes[i][0]} <greenspan>(${yourData.top_story_likes[i][1]} lần)</greenspan>`;
        topStoryLikes.appendChild(el);
    }

    // populate followers list
    randomfollowers();

    // populate total messages sent
    totalMessages.innerText = yourData.total_messages.toLocaleString();

    // populate total reacts and stickers sent
    totalStoryLikes.innerText = yourData.total_story_likes.toLocaleString();

    document.querySelector('#total_storylikes_ppl').innerText =
        yourData.total_story_likes_ppl.toLocaleString();

    document.querySelector('#blocked-number').innerText =
        yourData.blocked_number;

    document.querySelector(
        '#user-name'
    ).innerText = ` của @${yourData.user_name}`;
}

function secondsToHoursMinutes(seconds) {
    const hours = Math.floor(seconds / 3600);
    const remainingSeconds = seconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);

    return { hours, minutes };
}

function getRandomItems(array, count) {
    for (let i = array.length - 1; i > array.length - count - 1; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array.slice(-count);
}

function randomfollowers() {
    const random_followers = getRandomItems(followers_list, 5);
    const random_followers_elem = document.querySelector('#followers-list');
    const thank_you_msg = document.querySelector('#thank-you');
    random_followers_elem.innerHTML = '';
    for (let i = 0; i < random_followers.length; i++) {
        let el = document.createElement('li');
        left = Math.random() * 100;
        el.style.left = `${left}%`;
        el.style.transform = `translateX(${-left}%)`;
        el.classList.add('randompos');
        el.innerText = `@${random_followers[i]}`;
        random_followers_elem.appendChild(el);
    }
    thank_you_msg.innerText = getRandomItems(thank_you_note, 1);
}