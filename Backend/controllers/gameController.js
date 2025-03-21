const Game = require('../models/Game');
const User = require('../models/userModel');

// Controller to fetch all games
const getAllGames = async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching games.' });
  }
};

// Controller to search for games by title
const searchGame = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const games = await Game.find({ name: { $regex: query, $options: 'i' } });

    if (games.length === 0) {
      return res.status(404).json({ message: 'No games found' });
    }

    res.status(200).json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error searching for games' });
  }
};

// Controller to fetch game by ID
const getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    res.status(200).json(game);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching game details" });
  }
};

// Controller to add a game to the wishlist
const addToWishlist = async (req, res) => {
  const { userId, gameId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.wishlist.includes(gameId)) {
      return res.status(400).json({ message: 'Game already in wishlist' });
    }

    user.wishlist.push(gameId);
    await user.save();

    res.status(200).json({ message: 'Game added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding game to wishlist' });
  }
};

// Remove game from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { userId, gameId } = req.params;

    if (!userId || !gameId) return res.status(400).json({ message: 'User ID and Game ID are required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wishlist = user.wishlist.filter(id => id.toString() !== gameId);
    await user.save();

    res.status(200).json({ message: 'Game removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Controller to get the user's wishlist
const getUserWishlist = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('wishlist');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
};

// Controller to get the user's username , email and profile picture
// Controller to get the user's username, email, profile picture, and wishlist count
const getUserDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select('username email profilePicture friends wishlist');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate the number of friends and wishlist items
    const friendCount = user.friends ? user.friends.length : 0;
    const wishlistCount = user.wishlist ? user.wishlist.length : 0;

    // Include friendCount and wishlistCount in the response
    res.status(200).json({
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      friendCount: friendCount,
      wishlistCount: wishlistCount, // Add wishlist count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
};

module.exports = {
  getAllGames,
  addToWishlist,
  getUserWishlist,
  removeFromWishlist,
  getUserDetails,
  searchGame,
  getGameById
};

