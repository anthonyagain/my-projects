// const green100 = '#d7e0d9';  // Very light sage, almost white with green undertone
// const green200 = '#7a8c7e';  // Medium light sage gray

// more of a plain green version? i felt like this was bad before
const green300 = '#364939';  // More gray with green undertone
const green400 = '#273329';  // Muted forest
const green450 = '#2b382d';  // Grayish sage
const green500 = '#212924';  // Deep gray-green
const green600 = '#1d2420';  // Very subtle green-gray
const green675 = '#1b221d';  // Dark gray with green undertone
const green700 = '#1a201b';  // Almost charcoal with hint of green


const black = 'black';
const white = '#FFFFFF';

const veryDarkBG = 'oklab(0.239468 0.000131123 -0.00589392)';

const plainText = 'oklab(0.89908 -0.00192907 -0.0048306)';
const fadedText = 'oklab(0.686636 -0.00407365 -0.0149199)';
const extraFadedText = 'rgb(113, 113, 122)';
const brightText = 'oklab(0.999994 0.0000455678 0.0000200868)';

const redButton = 'rgb(220 38 38)';
const redButtonHover = 'rgb(185 28 28)';
const blueButton = 'rgb(45, 105, 205)';      // Brighter base blue
const blueButtonHover = 'rgb(59, 125, 230)';  // Brightens on hover


const textLink = "#4ade80";
// less prominent links
const textLinkDark = "#059669";

const emerald600 = 'rgb(5 150 105)';
const emerald700 = 'rgb(4 120 87)';
// emerald 600 and emerald 700
const greenButton = emerald600;
const greenButtonHover = emerald700;

export const colors = {

  registerPageBG: green700,
  registerPageFormBG: green400,
  registerPageFormInputBG: green600,
  registerPageFormInputBorder: green300,
  registerPageFormInputBorderFocus: emerald600,
  registerPageFormLabel: fadedText,
  registerPageTosText: extraFadedText,
  registerPageSubmitBtn: greenButton,
  registerPageSubmitBtnHover: greenButtonHover,

  serverSidebarBG: green700,
  serverSidebarLineAboveServerList: black,

  directMessagesBG: green500,
  directMessagesSettingsBG: green675,
  directMessagesSettingsHover: green400,
  directMessagesTitleText: fadedText,
  directMessagesSettingsText: plainText,
  directMessagesSettingsIcon: white,

  friendsButtonBG: green400,
  friendsButtonText: fadedText,
  friendsButtonTextHover: fadedText,
  friendsButtonHover: green300,

  openAllChatsBtn: green400,
  openAllChatsHover: green300,
  openAllChatsActive: green400,

  openSpecificChatBtn: green500,
  openSpecificChatHover: green450,
  openSpecificChatActive: green400,
  openSpecificChatText: fadedText,
  openSpecificChatTextHover: plainText,
  openSpecificChatTextActive: brightText,

  chatContentsBG: green400,
  chatContentsText: plainText,
  chatMessageDatetime: fadedText,

  sendMessageChatboxBG: green500,

  settingsNavbarBG: green500,
  settingsTabContentBG: green400,
  settingsTitleText: fadedText,
  settingsTabBtn: green500,
  settingsTabHover: green450,
  settingsTabActive: green400,
  settingsTabText: white,

  settingsTabTitle: white,
  settingsTabTextContents: white,

  logoutConfirmWindowTop: green400,
  logoutConfirmWindowBottom: green500,
  logoutConfirmWindowTitle: plainText,
  logoutConfirmWindowText: plainText,
  logoutConfirmWindowCancel: plainText,
  logoutConfirmWindowBtn: redButton,
  logoutConfirmWindowBtnHover: redButtonHover,
  logoutConfirmWindowBtnText: black,

  textLink: textLink,
  textLinkDark: textLinkDark,

  serverHashIconBG: green300,
  serverMembersListBG: green500,
  serverMembersListText: fadedText,
  serverMembersListHover: green400,

  serverHeaderInviteBtnBG: green400,
  serverInviteBtnAlertBG: green300,

  directMessagesExtraProfileMemberSinceBG: green400,

  friendsPageInputBG: veryDarkBG,
  friendsPageInputText: plainText,
  /* TODO, better color for this button? blue doesnt really fit, but the existing green options
  don't have enough contrast / don't stand out enough */
  friendsPageSubmitBtn: blueButton,
  friendsPageSubmitBtnHover: blueButtonHover,
  friendsPageSmallertext: fadedText,
  friendsPageWhiteText: plainText,

  friendsPagePendingRequestsBG: green300,

};
