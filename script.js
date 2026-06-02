async function updateStaffSection() {
    try {
        // Palitan ang URL na ito ng PUBLIC URL ng Railway service mo
        const response = await fetch('https://api.leonazura.xyz/api/members');
        const members = await response.json();

        // Hanapin ang container sa iyong HTML (Siguraduhin na may <div id="staff-container"></div> sa index.html mo)
        const container = document.getElementById('staff-container');
        if (!container) return;

        container.innerHTML = ''; // Linisin ang lumang listahan

        members.forEach(member => {
            // Gumawa ng HTML element para sa bawat member
            const memberDiv = document.createElement('div');
            memberDiv.className = 'staff-member';
            
            // I-display ang avatar at status indicator
            memberDiv.innerHTML = `
                <div class="avatar-wrapper">
                    <img src="${member.avatarURL}" alt="${member.displayName}" class="avatar">
                    <span class="status-indicator ${member.status}"></span>
                </div>
                <p>${member.displayName}</p>
            `;
            
            container.appendChild(memberDiv);
        });
    } catch (err) {
        console.error("Hindi makuha ang data:", err);
    }
}

// I-run pagka-load ng page
updateStaffSection();

// I-refresh ang data tuwing 30 segundo (para real-time)
setInterval(updateStaffSection, 30000);
