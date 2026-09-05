import {
  heroArrowsRightLeft,
  heroBanknotes,
  heroChatBubbleLeftRight,
  heroChevronRight,
  heroClipboardDocumentList,
  heroCube,
  heroDocumentText,
  heroIdentification,
  heroRectangleGroup,
  heroShoppingCart,
  heroTruck,
  heroUsers,
} from '@ng-icons/heroicons/outline';

export const moduleIcons: Readonly<Record<string, string>> = {
  overview: heroRectangleGroup,
  sales: heroShoppingCart,
  finance: heroBanknotes,
  procurement: heroTruck,
  inventory: heroCube,
  people: heroUsers,
  customerList: heroIdentification,
  contactHistory: heroChatBubbleLeftRight,
  quotes: heroDocumentText,
  paymentMatching: heroArrowsRightLeft,
  orderHandling: heroClipboardDocumentList,
  navCollapsed: heroChevronRight,
};
