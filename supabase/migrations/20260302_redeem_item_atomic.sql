-- Create atomic redeem_store_item RPC function
-- Handles coins deduction, stock decrement, and redemption record creation in a single transaction
CREATE OR REPLACE FUNCTION redeem_store_item(
  p_client_id UUID,
  p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item reward_store_items%ROWTYPE;
  v_current_coins INT;
  v_redemption_id UUID;
BEGIN
  -- Lock item row to prevent race conditions
  SELECT * INTO v_item 
  FROM reward_store_items 
  WHERE id = p_item_id AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;
  
  -- Check stock
  IF v_item.stock IS NOT NULL AND v_item.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'OUT_OF_STOCK');
  END IF;
  
  -- Lock and check coins
  SELECT game_coins INTO v_current_coins 
  FROM profiles 
  WHERE id = p_client_id
  FOR UPDATE;
  
  IF v_current_coins < v_item.coin_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_COINS');
  END IF;
  
  -- Deduct coins
  UPDATE profiles 
  SET game_coins = game_coins - v_item.coin_price
  WHERE id = p_client_id;
  
  -- Decrement stock if limited
  IF v_item.stock IS NOT NULL THEN
    UPDATE reward_store_items 
    SET stock = stock - 1 
    WHERE id = p_item_id;
  END IF;
  
  -- Create redemption record
  INSERT INTO reward_redemptions (client_id, item_id, coins_spent, status, fulfilled_at)
  VALUES (
    p_client_id,
    p_item_id,
    v_item.coin_price,
    CASE WHEN v_item.type = 'product' THEN 'pending' ELSE 'fulfilled' END,
    CASE WHEN v_item.type != 'product' THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_redemption_id;
  
  -- Log transaction
  INSERT INTO game_coins_history (client_id, amount, type, source, description, item_id)
  VALUES (p_client_id, -v_item.coin_price, 'spent', 'store', 'Troca: ' || v_item.name, p_item_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'remaining_coins', v_current_coins - v_item.coin_price,
    'item_type', v_item.type
  );
END;
$$;
