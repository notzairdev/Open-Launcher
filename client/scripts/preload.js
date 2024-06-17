const { CustomTitlebar, TitlebarColor } = require('custom-electron-titlebar')

window.addEventListener('DOMContentLoaded', () => {
    new CustomTitlebar({
        backgroundColor: TitlebarColor.TRANSPARENT,
        maximizable: false,
        containerOverflow: 'hidden',
        unfocusEffect: true
    })
})