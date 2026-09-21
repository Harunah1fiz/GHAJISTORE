
document.addEventListener("DOMContentLoaded", () => {
let accBtn = document.querySelector('#menu-btn');
const panel = accBtn.nextElementSibling;
let navigation = document.querySelector('.navigation')
const sideBtnEle = document.querySelector('#toggle-sidebar')
const asideEle = document.querySelector('#aside')
const parentHeaderEle = document.querySelector('#top-bar')
const LogoEle = document.querySelector('#logo-lg')
const LogoSmEle = document.querySelector('#logo-sm')

const input = document.getElementById('product-image');
const holder = document.querySelector('.image-holder');
let checked = false

const notificationPanel = document.querySelector('#notification-panel');
const notificationButton = document.querySelector('#notification');
const notificationItems = document.querySelector('#notification-items');
const notificationMeta = document.querySelector('#notification-meta');
const markAllReadBtn = document.querySelector('#mark-all-read');
const deleteAllBtn = document.querySelector('#delete-all-notifications');

const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

const fetchNotifications = async () => {
    if (!notificationItems) return;
    notificationItems.innerHTML = '<div class="text-center text-xs text-slate-400">Loading notifications…</div>';
    try {
        const res = await fetch('/reports/api/notifications/');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load notifications.');
        if (!data.notifications.length) {
            notificationItems.innerHTML = '<div class="text-center text-xs text-slate-400">No notifications yet.</div>';
            notificationMeta.textContent = '0 notifications';
            return;
        }
        notificationItems.innerHTML = data.notifications.map(notification => {
            const readClass = notification.is_read ? 'bg-slate-50' : 'bg-slate-100';
            return `<div class="rounded-3xl border border-slate-200 p-3 ${readClass} flex items-start gap-3">
                <div class="grid place-items-center rounded-full w-10 h-10 bg-slate-100 text-slate-700">
                    <i class="fas fa-${notification.icon || 'bell'}"></i>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between gap-2">
                        <p class="font-semibold text-sm text-slate-900">${notification.title}</p>
                        <button data-id="${notification.id}" data-action="toggle-read" class="text-xs text-slate-500">${notification.is_read ? 'Mark unread' : 'Mark read'}</button>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">${notification.message}</p>
                    <p class="text-[11px] text-slate-400 mt-2">${new Date(notification.created_at).toLocaleString()}</p>
                </div>
                <button data-id="${notification.id}" data-action="delete" class="text-xs text-rose-500">Delete</button>
            </div>`;
        }).join('');
        notificationMeta.textContent = `${data.notifications.length} notification${data.notifications.length === 1 ? '' : 's'}`;
    } catch (error) {
        notificationItems.innerHTML = `<div class="text-center text-xs text-rose-500">${error.message}</div>`;
    }
};

const toggleNotificationPanel = async () => {
    if (!notificationPanel) return;
    notificationPanel.classList.toggle('hidden');
    if (!notificationPanel.classList.contains('hidden')) {
        await fetchNotifications();
    }
};

const handleNotificationAction = async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (!id || !action) return;
    const url = action === 'delete' ? `/reports/api/notifications/${id}/delete/` : `/reports/api/notifications/${id}/mark-read/`;
    const method = action === 'delete' ? 'DELETE' : 'POST';
    try {
        const res = await fetch(url, {
            method,
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to update notification.');
        await fetchNotifications();
    } catch (error) {
        console.error(error);
    }
};

markAllReadBtn?.addEventListener('click', async () => {
    try {
        const res = await fetch('/reports/api/notifications/mark-all-read/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to mark all read.');
        await fetchNotifications();
    } catch (error) {
        console.error(error);
    }
});

deleteAllBtn?.addEventListener('click', async () => {
    try {
        const res = await fetch('/reports/api/notifications/clear-all/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to clear notifications.');
        await fetchNotifications();
    } catch (error) {
        console.error(error);
    }
});


// online and offline status



 // Tab Menu
  const tabs = document.querySelectorAll('.tab-link')
  
//Image preview
// input.addEventListener('change', function(){
//   const file = this.files[0];
//   let name = file.name
//  let itemName = `${file.name.split('.')[0].split(' ')[0]}_product`;

//   const imageUrl = URL.createObjectURL(file);
//   const fileSize = (file.size/1024).toFixed(2) + 'KB';

//   holder.innerHTML = `
//         <div class="imageContainer flex flex-col  rounded-md  w-40">
//           <figure class="flex justify-center">
//           <img src="${imageUrl}" alt="Upload" class="w-30 h-30 object-cover mb-2">
//           </figure>
//           <div class="text-sm border-gray-300 border-t border-b pt-2 pb-2 font-bold ">
//               <p>${itemName}</p>
//               <span>${fileSize}</span>
//           </div>
//           <button class="hover:text-red-400 remove-image">remove Image</button>
//         </div>
//   `
//   lucide.createIcons();

//   holder.querySelector('.remove-image').addEventListener('click', (e) => {
//         e.preventDefault();
      
//         input.value = '';
//         holder.innerHTML = `
//             <div class="flex flex-col items-center text-gray-400">
//                 <p>click to upload image</p>
//                 <i data-lucide="image-plus" class="w-10 h-10"></i>
//             </div>
//         `;
//         lucide.createIcons();
//     });

// })
function openMenu(){
  accBtn.classList.add('active');
  panel.style.maxHeight = panel.scrollHeight + "px"
}

function closeMenu(){
  accBtn.classList.remove('active');
  panel.style.maxHeight = null
}
if(panel.querySelector('.active')){
  openMenu();
}

accBtn.addEventListener('click', function(e){
  if(this.classList.contains('active')){
    closeMenu()
    
  }
  else{
    openMenu();
  }
})






const mouseOverHandler = function () {
    this.classList.remove('active');
};

const mouseOutHandler = function () {
    this.classList.add('active');
};

parentHeaderEle.addEventListener('click', async function (e) { 
    const toggleBtn = e.target.closest('#toggle-sidebar');
    const profileDet = e.target.closest("#profile-detail");
    const notification = e.target.closest("#notification");
    
    
    if (!(toggleBtn || profileDet || notification)) return;

    if (toggleBtn) {
        checked = !checked; // toggle checked
        asideEle.classList.toggle('active');
        console.log(checked);

        if (checked) {
            console.log(LogoEle,LogoSmEle);
        // add listeners
        LogoEle.classList.add('hidden');
        LogoSmEle.classList.remove('hidden');
        asideEle.addEventListener('mouseover', mouseOverHandler);
        asideEle.addEventListener('mouseout', mouseOutHandler);
        } else {
        // remove listeners
        LogoEle.classList.remove('hidden');
        LogoSmEle.classList.add('hidden');
        asideEle.removeEventListener('mouseover', mouseOverHandler);
        asideEle.removeEventListener('mouseout', mouseOutHandler);
        }
    }

    if (profileDet) {
        const userMenu = document.querySelector('.user-menu');
        userMenu.classList.toggle('active');
    }

    if (notification) {
        await toggleNotificationPanel();
    }
});

    notificationPanel?.addEventListener('click', handleNotificationAction);
    document.addEventListener('click', (event) => {
        if (!notificationPanel || notificationPanel.classList.contains('hidden')) return;
        if (event.target.closest('#notification') || event.target.closest('#notification-panel')) return;
        notificationPanel.classList.add('hidden');
    });




  const overlay = document.querySelector(".modal-overlay");
  const modals = document.querySelectorAll(".modal");
  const openButtons = document.querySelectorAll("[data-modal]");
  const closeButtons = document.querySelectorAll(".close-modal, .modal-close, .cancelChanges");

  // // Open modal
  // openButtons.forEach(btn => {
  //   btn.addEventListener("click", () => {
  //     const modalName = btn.dataset.modal;
  //     openModal(modalName);
  //   });
  // });

  // // Close modal buttons
  // closeButtons?.forEach(btn => {
  //   btn.addEventListener("click", closeAllModals);
  // });

  // // Click overlay closes modal
  // overlay?.addEventListener("click", closeAllModals);

  // ESC key closes modal
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAllModals();
  });

  function openModal(name) {
    closeAllModals(); // ensure only one modal opens
    const modal = document.querySelector(`.modal[data-modal="${name}"]`);
    if (!modal) return;

    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  function closeAllModals() {
    overlay.classList.add("hidden");
    modals.forEach(modal => modal.classList.add("hidden"));
    document.body.classList.remove("overflow-hidden");
  }

  

})
