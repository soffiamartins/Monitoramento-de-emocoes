
  document.addEventListener('DOMContentLoaded', () => {
    const changeBtn = document.getElementById('changeAvatarBtn');
    const picker = document.getElementById('avatarPicker');
    const avatarInput = document.getElementById('avatarInput');
    const currentAvatarImg = document.getElementById('currentAvatar');

    if (!changeBtn || !picker) return;

    changeBtn.addEventListener('click', () => {
      picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
    });

    picker.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const src = opt.dataset.avatar;
        // atualiza visual
        currentAvatarImg.src = src;
        avatarInput.value = src;

        picker.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
  });

