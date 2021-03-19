import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const repeatedProduct = cart.find((product) => product.id === productId);
      const { data: stock } = await api.get<Stock>(`stock/${productId}`);

      if (repeatedProduct) {
        if (stock.amount > repeatedProduct.amount) {
          const newCart = cart.map((item) =>
            item.id === productId ? { ...item, amount: item.amount + 1 } : item
          );
          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      } else {
        const response = await api.get(`products/${productId}`);
        const selectedProduct = response.data;
        if (stock.amount > 0) {
          setCart([...cart, { ...selectedProduct, amount: 1 }]);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, { ...selectedProduct, amount: 1 }])
          );
        }
      }
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const selectedProduct = cart.find((product) => product.id === productId);
      if (!selectedProduct) {
        toast.error("Erro na remoção do produto");
        return;
      }
      const newCart = cart.filter((item) => item.id !== productId);
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) {
        return;
      }
      const response = await api.get(`/stock/${productId}`);
      const { amount: productAmount } = response.data;
      const hasStock = amount <= productAmount;
      if (!hasStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productExists = cart.find((item) => item.id === productId);
      if (!productExists) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
      const newCart = cart.map((item) =>
        item.id === productId ? { ...item, amount: amount } : item
      );

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
